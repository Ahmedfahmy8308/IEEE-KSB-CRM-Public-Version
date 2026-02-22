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
import { getConfig } from '@/lib/config';
import {
  readAllInterviewApplicants,
  batchAppendInterviewApplicants,
  ensureS2Headers,
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
  NATIONAL_ID: 5,
  AGE: 6,
  CITY: 7,
  ADDRESS: 8,
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

    // 2. Read existing DB records to find already-pulled timestamps
    const existingRecords = await readAllInterviewApplicants(season);
    const existingTimestamps = new Set<string>();
    for (const rec of existingRecords) {
      if (rec.timestamp) {
        existingTimestamps.add(rec.timestamp.trim());
      }
    }

    // 3. Collect all existing IDs across BOTH seasons to prevent ID duplicates
    const existingS1Ids = await getAllInterviewIds('S1');
    const existingS2Ids = await getAllInterviewIds(season);
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

    // 5. Process each origin row — skip if timestamp already exists in DB
    const newRecords: InterviewApplicant[] = [];
    let matched = 0;
    let needReview = 0;
    let wrongId = 0;
    let noId = 0;
    let skippedDuplicates = 0;

    // Pick the correct origin column mapping based on season
    const COLS = season === 'S1' ? ORIGIN_S1_COLS : ORIGIN_S2_COLS;

    for (const row of originRows) {
      // Dedup by timestamp
      const timestamp = (row[COLS.TIMESTAMP] || '').trim();
      if (timestamp && existingTimestamps.has(timestamp)) {
        skippedDuplicates++;
        continue;
      }

      const _emailAddress = (row[COLS.EMAIL_ADDRESS] || '').toLowerCase().trim();

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
            // ID + Phone match → Matched, auto-approve, carry over same ID
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
        state: '',
        note: '',
        id: assignedId,
        approved: approvedStatus,
        isEmailSend: false,
        isApprovedEmailSend: false,
        log: '',
        s1IdEntered: enteredS1Id,
        idValidationStatus: validationStatus,
        pullSource: `pull-${new Date().toISOString().split('T')[0]}`,
      };

      newRecords.push(applicant);

      // Count stats
      if (validationStatus === VALIDATION_STATUS.MATCHED) matched++;
      else if (validationStatus === VALIDATION_STATUS.NEED_REVIEW) needReview++;
      else if (validationStatus === VALIDATION_STATUS.WRONG_ID) wrongId++;
      else noId++;
    }

    // 6. Ensure S2-specific column headers exist, then batch-append
    if (season === 'S2') {
      await ensureS2Headers(season);
    }

    if (newRecords.length > 0) {
      await batchAppendInterviewApplicants(newRecords, season);
    }

    return NextResponse.json({
      message: `Pull complete for Interview ${season}`,
      totalInOrigin: originRows.length,
      pulled: newRecords.length,
      skippedDuplicates,
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

    return NextResponse.json({
      season,
      isActive: config.isActive,
      hasOriginSheet: !!config.originSheetId,
      hasTabName: !!config.originTabName,
    });
  } catch (error) {
    console.error('Pull config error:', error);
    return NextResponse.json({ error: 'Failed to get pull configuration' }, { status: 500 });
  }
});
