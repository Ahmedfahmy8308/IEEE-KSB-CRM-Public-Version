// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Pull Records API Route
 * POST /api/interviews/pull - Pull new records from origin Google Forms sheet into DB
 *
 * For S2: validates entered S1 IDs against S1 data
 * - ID + Phone match → approved, same ID carried over
 * - ID match, phone mismatch → Need Review
 * - ID no match → Wrong ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readRangeExternal } from '@/lib/sheets/base';
import { getConfig, updateConfig } from '@/lib/config';
import {
  readAllInterviewApplicants,
  batchAppendInterviewApplicants,
  ensureInterviewHeaders,
  type InterviewApplicant,
  getAllInterviewIds,
} from '@/lib/sheets/interview';

// Origin form column mapping for S1 (has "If yes role" at col 15)
const ORIGIN_S1_COLS = {
  TIMESTAMP: 0,
  EMAIL_ADDRESS: 1,
  FULL_NAME: 2,
  EMAIL: 3,
  PHONE_NUMBER: 4,
  AGE: 5,
  CITY: 6,
  ADDRESS: 7,
  NATIONAL_ID: 8,
  PERSONAL_PHOTO: 9,
  FACULTY: 10,
  DEPARTMENT: 11,
  LEVEL: 12,
  WHAT_KNOW_IEEE: 13,
  BEEN_IEEEAN_BEFORE: 14,
  IF_YES_ROLE: 15,
  TRACK_APPLYING: 16,
  WHY_COMMITTEE: 17,
  WHY_IEEE_KSB: 18,
};

// Origin form column mapping for S2 (has "S1 ID" at col 15 instead of role)
const ORIGIN_S2_COLS = {
  TIMESTAMP: 0,
  EMAIL_ADDRESS: 1,
  FULL_NAME: 2,
  EMAIL: 3,
  PHONE_NUMBER: 4,
  AGE: 5,
  CITY: 6,
  ADDRESS: 7,
  NATIONAL_ID: 8,
  PERSONAL_PHOTO: 9,
  FACULTY: 10,
  DEPARTMENT: 11,
  LEVEL: 12,
  WHAT_KNOW_IEEE: 13,
  BEEN_IEEEAN_BEFORE: 14,
  S1_ID_IF_EXISTS: 15,
  TRACK_APPLYING: 16,
  WHY_COMMITTEE: 17,
  WHY_IEEE_KSB: 18,
};

// Validation status constants
const VALIDATION_STATUS = {
  MATCHED: 'Matched', // ID + phone both match S1
  NEED_REVIEW: 'Need Review', // ID matches but phone doesn't
  WRONG_ID: 'Wrong ID', // ID doesn't match any S1 record
  NO_ID: '', // No S1 ID was entered
} as const;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+2|002)/, '');
}

function generateRandomId(): string {
  const num = Math.floor(Math.random() * 100000);
  return num.toString().padStart(5, '0');
}

function generateUniqueIdSync(existingSet: Set<string>): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = generateRandomId();
    if (!existingSet.has(candidate)) {
      existingSet.add(candidate);
      return candidate;
    }
  }
  // Fallback: sequential
  for (let i = 1; i <= 99999; i++) {
    const candidate = i.toString().padStart(5, '0');
    if (!existingSet.has(candidate)) {
      existingSet.add(candidate);
      return candidate;
    }
  }
  throw new Error('Unable to generate unique ID');
}

/**
 * Parse Google Forms timestamps in various locale formats.
 * Handles:
 *   - Arabic: "10:30:16 م 2026/02/17" (H:MM:SS [ص=AM/م=PM] YYYY/MM/DD)
 *   - US English: "2/17/2026 22:30:16" (M/D/YYYY H:MM:SS)
 *   - ISO strings and anything Date() can parse
 * Returns null if unparseable.
 */
function parseTimestamp(ts: string): Date | null {
  // Arabic Google Forms format: H:MM:SS ص/م YYYY/MM/DD
  // ص = صباحاً (AM), م = مساءً (PM)
  const arMatch = ts.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*([صم])\s+(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (arMatch) {
    const [, hourStr, minute, second, ampm, year, month, day] = arMatch;
    let hour = parseInt(hourStr);
    if (ampm === 'م' && hour < 12) hour += 12;      // PM
    if (ampm === 'ص' && hour === 12) hour = 0;       // 12 AM = 0
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      hour, parseInt(minute), parseInt(second)
    );
  }

  // US English Google Forms format: M/D/YYYY H:MM:SS
  const gfMatch = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (gfMatch) {
    const [, month, day, year, hour, minute, second] = gfMatch;
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hour), parseInt(minute), parseInt(second)
    );
  }

  // Fallback: native Date parser
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

interface PullConfig {
  originSheetId: string;
  originTabName: string;
  season: string;
  isActive: boolean;
}

function getPullConfig(season: string): PullConfig {
  const cfg = getConfig();
  if (season === 'S1') {
    const s1 = cfg.pull.interview_s1;
    return {
      originSheetId: s1.originSheetId,
      originTabName: s1.originTabName,
      season: 'S1',
      isActive: s1.active,
    };
  }
  const s2 = cfg.pull.interview_s2;
  return {
    originSheetId: s2.originSheetId,
    originTabName: s2.originTabName,
    season: 'S2',
    isActive: s2.active,
  };
}

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S2';
    const config = getPullConfig(season);

    if (!config.isActive) {
      return NextResponse.json(
        {
          error: `Pull is not active for Interview ${season}. Enable it in config.json under pull.interview_${season.toLowerCase()}.active`,
        },
        { status: 400 }
      );
    }

    if (!config.originSheetId || !config.originTabName) {
      return NextResponse.json(
        {
          error: `Origin sheet not configured for Interview ${season}. Set ORIGIN_INTERVIEW_${season}_SHEET_ID and TAB_NAME in .env`,
        },
        { status: 400 }
      );
    }

    // 1. Read all origin form responses (skip header row)
    const originRows = await readRangeExternal(config.originSheetId, config.originTabName, 'A2:S');

    if (!originRows || originRows.length === 0) {
      return NextResponse.json({ message: 'No records found in origin sheet', pulled: 0 });
    }

    // 2. Read existing DB records and build timestamp set as fallback dedup
    const existingRecords = await readAllInterviewApplicants(season);
    const existingTimestamps = new Set<string>();
    for (const rec of existingRecords) {
      if (rec.timestamp) {
        existingTimestamps.add(rec.timestamp.trim());
      }
    }

    // Use the saved lastPullTimestamp from config (survives record deletions)
    const pullConfigKey = season === 'S1' ? 'interview_s1' : 'interview_s2';
    const savedTimestamp = getConfig().pull[pullConfigKey].lastPullTimestamp;
    let latestTimestamp: Date | null = savedTimestamp ? parseTimestamp(savedTimestamp) : null;

    // If no saved timestamp, fall back to computing from DB records
    if (!latestTimestamp) {
      for (const rec of existingRecords) {
        if (rec.timestamp) {
          const d = parseTimestamp(rec.timestamp.trim());
          if (d && (!latestTimestamp || d > latestTimestamp)) {
            latestTimestamp = d;
          }
        }
      }
    }

    // 3. Collect all existing IDs across BOTH seasons to prevent ID duplicates
    const existingS1Ids = await getAllInterviewIds('S1');
    const existingS2Ids = await getAllInterviewIds('S2');
    const allExistingIds = new Set([...existingS1Ids, ...existingS2Ids]);

    // 4. For S2: load S1 data for ID validation
    let s1Records: InterviewApplicant[] = [];
    if (season === 'S2') {
      s1Records = await readAllInterviewApplicants('S1');
    }

    // Build S1 lookup maps
    const s1ById = new Map<string, InterviewApplicant>();
    for (const rec of s1Records) {
      if (rec.id) {
        s1ById.set(rec.id.trim(), rec);
      }
    }

    // 5. Process each origin row — skip if timestamp is not newer than the latest in DB
    const newRecords: InterviewApplicant[] = [];
    let matched = 0;
    let needReview = 0;
    let wrongId = 0;
    let noId = 0;
    let skippedDuplicates = 0;

    // Pick the correct origin column mapping based on season
    const COLS = season === 'S1' ? ORIGIN_S1_COLS : ORIGIN_S2_COLS;

    // Compute max timestamp from ALL origin rows (what we've "seen")
    let maxOriginTimestamp: Date | null = null;
    // Log first 3 timestamps to debug format issues
    const sampleTimestamps: string[] = [];
    for (const row of originRows) {
      const ts = (row[COLS.TIMESTAMP] || '').trim();
      if (ts) {
        if (sampleTimestamps.length < 3) {
          sampleTimestamps.push(JSON.stringify(ts));
        }
        const d = parseTimestamp(ts);
        if (d && (!maxOriginTimestamp || d > maxOriginTimestamp)) {
          maxOriginTimestamp = d;
        }
      }
    }
    console.log('[Pull] Sample timestamps from origin:', sampleTimestamps.join(', '));
    console.log('[Pull] COLS.TIMESTAMP index:', COLS.TIMESTAMP);
    console.log('[Pull] First row raw:', JSON.stringify(originRows[0]?.slice(0, 3)));

    for (const row of originRows) {
      const timestamp = (row[COLS.TIMESTAMP] || '').trim();

      // Skip if this exact timestamp already exists in DB (fallback dedup)
      if (timestamp && existingTimestamps.has(timestamp)) {
        skippedDuplicates++;
        continue;
      }

      // Skip if timestamp is not newer than the latest in DB
      if (timestamp && latestTimestamp) {
        const rowDate = parseTimestamp(timestamp);
        if (rowDate && rowDate <= latestTimestamp) {
          skippedDuplicates++;
          continue;
        }
      }

      // Map origin columns to DB format
      const enteredS1Id = season === 'S2' ? (row[ORIGIN_S2_COLS.S1_ID_IF_EXISTS] || '').trim() : '';
      const phoneNumber = (row[COLS.PHONE_NUMBER] || '').trim();

      let validationStatus: string = VALIDATION_STATUS.NO_ID;
      let assignedId = '';
      let approvedStatus = '';

      if (season === 'S2' && enteredS1Id) {
        const s1Match = s1ById.get(enteredS1Id);

        if (s1Match) {
          const s1Phone = normalizePhone(s1Match.phoneNumber || '');
          const s2Phone = normalizePhone(phoneNumber);

          if (s1Phone && s2Phone && s1Phone === s2Phone) {
            // ID + Phone match → Matched, auto-approve, mark as complete, email already sent
            validationStatus = VALIDATION_STATUS.MATCHED;
            approvedStatus = 'approved';
            assignedId = enteredS1Id;
            // Make sure this ID isn't already used by someone else in S2
            if (allExistingIds.has(assignedId)) {
              // ID already taken in S2, still carry it over (it's their own ID)
              // This handles re-pulls gracefully
            }
            allExistingIds.add(assignedId);
          } else {
            // ID match but phone doesn't → Need Review
            validationStatus = VALIDATION_STATUS.NEED_REVIEW;
            assignedId = enteredS1Id;
            allExistingIds.add(assignedId);
          }
        } else {
          // ID doesn't match any S1 record → Wrong ID
          validationStatus = VALIDATION_STATUS.WRONG_ID;
          // Generate a new ID for them
          assignedId = generateUniqueIdSync(allExistingIds);
        }
      } else {
        // No S1 ID entered or S1 season → generate new ID
        assignedId = generateUniqueIdSync(allExistingIds);
      }

      // Build log entries for this pulled member
      // Format: "TIMESTAMP | actor | action" per line (parsed by member page)
      const pullTimestamp = new Date().toISOString();
      const logLines: string[] = [];

      if (season === 'S2' && enteredS1Id) {
        if (validationStatus === VALIDATION_STATUS.MATCHED) {
          logLines.push(`${pullTimestamp} | system | Pulled from origin form; S1 ID entered: ${enteredS1Id}; ID validation: Matched (ID + phone matched S1); Auto-approved: yes; ID carried over from S1: ${assignedId}`);
        } else if (validationStatus === VALIDATION_STATUS.NEED_REVIEW) {
          logLines.push(`${pullTimestamp} | system | Pulled from origin form; S1 ID entered: ${enteredS1Id}; ID validation: Need Review (ID matched S1 but phone mismatch); ID carried over: ${assignedId}`);
        } else if (validationStatus === VALIDATION_STATUS.WRONG_ID) {
          logLines.push(`${pullTimestamp} | system | Pulled from origin form; S1 ID entered: ${enteredS1Id}; ID validation: Wrong ID (no matching S1 record); New ID generated: ${assignedId}`);
        }
      } else if (season === 'S2') {
        logLines.push(`${pullTimestamp} | system | Pulled from origin form; No S1 ID entered; New ID generated: ${assignedId}`);
      } else {
        logLines.push(`${pullTimestamp} | system | Pulled from origin form; New ID generated: ${assignedId}`);
      }

      const pullLog = logLines.join('\n');

      const applicant: InterviewApplicant = {
        timestamp: row[COLS.TIMESTAMP] || '',
        emailAddress: row[COLS.EMAIL_ADDRESS] || '',
        fullName: row[COLS.FULL_NAME] || '',
        email: row[COLS.EMAIL] || '',
        phoneNumber: phoneNumber,
        nationalId: row[COLS.NATIONAL_ID] || '',
        age: row[COLS.AGE] || '',
        city: row[COLS.CITY] || '',
        address: row[COLS.ADDRESS] || '',
        personalPhoto: row[COLS.PERSONAL_PHOTO] || '',
        faculty: row[COLS.FACULTY] || '',
        department: row[COLS.DEPARTMENT] || '',
        level: row[COLS.LEVEL] || '',
        whatKnowIEEE: row[COLS.WHAT_KNOW_IEEE] || '',
        beenIEEEanBefore: row[COLS.BEEN_IEEEAN_BEFORE] || '',
        ifYesRole: season === 'S1' ? row[ORIGIN_S1_COLS.IF_YES_ROLE] || '' : '',
        trackApplying: row[COLS.TRACK_APPLYING] || '',
        whyCommittee: row[COLS.WHY_COMMITTEE] || '',
        whyIEEEKSB: row[COLS.WHY_IEEE_KSB] || '',
        interviewDay: '',
        interviewTime: '',
        state: validationStatus === VALIDATION_STATUS.MATCHED ? 'Complete Interview' : '',
        note: '',
        id: assignedId,
        approved: approvedStatus,
        isEmailSend: validationStatus === VALIDATION_STATUS.MATCHED,
        isApprovedEmailSend: false,
        log: pullLog,
        s1IdEntered: enteredS1Id,
        idValidationStatus: validationStatus,
        pullSource: `pull-${new Date().toISOString().split('T')[0]}`,
        interviewMode: 'Physical',
      };

      newRecords.push(applicant);

      // Count stats
      if (validationStatus === VALIDATION_STATUS.MATCHED) matched++;
      else if (validationStatus === VALIDATION_STATUS.NEED_REVIEW) needReview++;
      else if (validationStatus === VALIDATION_STATUS.WRONG_ID) wrongId++;
      else noId++;
    }

    // 6. Ensure the destination sheet matches the selected season schema, then batch-append
    await ensureInterviewHeaders(season);

    if (newRecords.length > 0) {
      await batchAppendInterviewApplicants(newRecords, season);
    }

    // Always save the max timestamp from ALL origin rows we've seen.
    // This ensures deleted records won't be re-imported on future pulls.
    const finalTimestamp = maxOriginTimestamp && (!latestTimestamp || maxOriginTimestamp > latestTimestamp)
      ? maxOriginTimestamp
      : latestTimestamp;
    console.log('[Pull] maxOriginTimestamp:', maxOriginTimestamp?.toISOString(), 'latestTimestamp:', latestTimestamp?.toISOString(), 'finalTimestamp:', finalTimestamp?.toISOString());
    if (finalTimestamp) {
      console.log('[Pull] Saving lastPullTimestamp to config for', pullConfigKey);
      await updateConfig({
        pull: {
          [pullConfigKey]: {
            lastPullTimestamp: finalTimestamp.toISOString(),
          },
        },
      } as Parameters<typeof updateConfig>[0]);
      console.log('[Pull] Config saved successfully');
    } else {
      console.log('[Pull] WARNING: No finalTimestamp to save!');
    }

    return NextResponse.json({
      message: `Pull complete for Interview ${season}`,
      totalInOrigin: originRows.length,
      pulled: newRecords.length,
      skippedDuplicates,
      savedTimestamp: finalTimestamp?.toISOString() || null,
      validation: {
        matched,
        needReview,
        wrongId,
        noId,
      },
    });
  } catch (error) {
    console.error('Pull error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pull records' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/interviews/pull - Get pull configuration status
 */
export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S2';
    const config = getPullConfig(season);
    const pullConfigKey = season === 'S1' ? 'interview_s1' : 'interview_s2';
    const lastPullTimestamp = getConfig().pull[pullConfigKey].lastPullTimestamp || null;

    return NextResponse.json({
      season,
      isActive: config.isActive,
      hasOriginSheet: !!config.originSheetId,
      hasTabName: !!config.originTabName,
      lastPullTimestamp,
    });
  } catch (error) {
    console.error('Pull config error:', error);
    return NextResponse.json({ error: 'Failed to get pull configuration' }, { status: 500 });
  }
});

/**
 * DELETE /api/interviews/pull - Reset lastPullTimestamp (allows fresh re-pull)
 */
export const DELETE = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S2';
    const pullConfigKey = season === 'S1' ? 'interview_s1' : 'interview_s2';

    await updateConfig({
      pull: {
        [pullConfigKey]: {
          lastPullTimestamp: '',
        },
      },
    } as Parameters<typeof updateConfig>[0]);

    return NextResponse.json({
      message: `Pull timestamp reset for Interview ${season}. Next pull will import all records not already in the database.`,
    });
  } catch (error) {
    console.error('Reset timestamp error:', error);
    return NextResponse.json({ error: 'Failed to reset pull timestamp' }, { status: 500 });
  }
});
