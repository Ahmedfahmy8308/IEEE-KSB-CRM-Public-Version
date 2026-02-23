// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Pull Records API Route
 * POST /api/Welcome-Day/pull - Pull new records from origin Google Forms sheet into DB
 * GET  /api/Welcome-Day/pull - Get pull configuration status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readRangeExternal } from '@/lib/sheets/base';
import { getConfig, updateConfig } from '@/lib/config';
import {
  readAllWelcomeDayAttendees,
  batchAppendWelcomeDayAttendees,
  type WelcomeDayAttendee,
} from '@/lib/sheets/welcomeDay';

// Origin form column mapping for Welcome Day
// Columns: Timestamp, Email Address, Full name, Email Address, Phone number,
//          National ID (upload), Is IEEE member, Committee, Payment Method,
//          Payment Screenshot (upload), Reference Number
const ORIGIN_COLS = {
  TIMESTAMP: 0,
  EMAIL_ADDRESS: 1,
  FULL_NAME: 2,
  EMAIL: 3,
  PHONE_NUMBER: 4,
  NATIONAL_ID: 5,
  IS_IEEE_MEMBER: 6,
  COMMITTEE: 7,
  PAYMENT_METHOD: 8,
  PAYMENT_SCREENSHOT: 9,
  REFERENCE_NUMBER: 10,
};

interface PullConfig {
  originSheetId: string;
  originTabName: string;
  season: string;
  isActive: boolean;
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

function getPullConfig(season: string): PullConfig {
  const cfg = getConfig();
  if (season === 'S1') {
    const s1 = cfg.pull.welcome_day_s1;
    return {
      originSheetId: s1.originSheetId,
      originTabName: s1.originTabName,
      season: 'S1',
      isActive: s1.active,
    };
  }
  const s2 = cfg.pull.welcome_day_s2;
  return {
    originSheetId: s2.originSheetId,
    originTabName: s2.originTabName,
    season: 'S2',
    isActive: s2.active,
  };
}

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S1';
    const config = getPullConfig(season);

    if (!config.isActive) {
      return NextResponse.json(
        {
          error: `Pull is not active for Welcome Day ${season}. Enable it in config under pull.welcome_day_${season.toLowerCase()}.active`,
        },
        { status: 400 }
      );
    }

    if (!config.originSheetId || !config.originTabName) {
      return NextResponse.json(
        {
          error: `Origin sheet not configured for Welcome Day ${season}. Set originSheetId and originTabName in config.`,
        },
        { status: 400 }
      );
    }

    // 1. Read all origin form responses (skip header row)
    const originRows = await readRangeExternal(config.originSheetId, config.originTabName, 'A2:K');

    if (!originRows || originRows.length === 0) {
      return NextResponse.json({
        message: 'No records found in origin sheet',
        pulled: 0,
        skippedDuplicates: 0,
      });
    }

    // 2. Read existing DB records and build timestamp set as fallback dedup
    const existingRecords = await readAllWelcomeDayAttendees(season);
    const existingTimestamps = new Set<string>();
    for (const rec of existingRecords) {
      if (rec.timestamp) {
        existingTimestamps.add(rec.timestamp.trim());
      }
    }

    // Use the saved lastPullTimestamp from config (survives record deletions)
    const pullConfigKey = season === 'S1' ? 'welcome_day_s1' : 'welcome_day_s2';
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

    // 3. Process each origin row — only pull rows newer than the latest in DB
    const newRecords: WelcomeDayAttendee[] = [];
    let skippedDuplicates = 0;

    // Compute max timestamp from ALL origin rows (what we've "seen")
    let maxOriginTimestamp: Date | null = null;
    for (const row of originRows) {
      const ts = (row[ORIGIN_COLS.TIMESTAMP] || '').trim();
      if (ts) {
        const d = parseTimestamp(ts);
        if (d && (!maxOriginTimestamp || d > maxOriginTimestamp)) {
          maxOriginTimestamp = d;
        }
      }
    }

    for (const row of originRows) {
      const timestamp = (row[ORIGIN_COLS.TIMESTAMP] || '').trim();

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

      const attendee: WelcomeDayAttendee = {
        timestamp: row[ORIGIN_COLS.TIMESTAMP] || '',
        emailAddress: row[ORIGIN_COLS.EMAIL_ADDRESS] || '',
        fullName: row[ORIGIN_COLS.FULL_NAME] || '',
        email: row[ORIGIN_COLS.EMAIL] || '',
        phoneNumber: row[ORIGIN_COLS.PHONE_NUMBER] || '',
        nationalId: row[ORIGIN_COLS.NATIONAL_ID] || '',
        isIEEEMember: row[ORIGIN_COLS.IS_IEEE_MEMBER] || '',
        committee: row[ORIGIN_COLS.COMMITTEE] || '',
        paymentMethod: row[ORIGIN_COLS.PAYMENT_METHOD] || '',
        paymentScreenshot: row[ORIGIN_COLS.PAYMENT_SCREENSHOT] || '',
        referenceNumber: row[ORIGIN_COLS.REFERENCE_NUMBER] || '',
        checked: 'Not Checked',
        qrCode: '',
        attended: '',
        isEmailSend: false,
        note: '',
        log: `pull-${new Date().toISOString().split('T')[0]}`,
      };

      newRecords.push(attendee);
    }

    // 4. Batch-append new records
    if (newRecords.length > 0) {
      await batchAppendWelcomeDayAttendees(newRecords, season);
    }

    // Always save the max timestamp from ALL origin rows we've seen.
    // This ensures deleted records won't be re-imported on future pulls.
    const finalTimestamp = maxOriginTimestamp && (!latestTimestamp || maxOriginTimestamp > latestTimestamp)
      ? maxOriginTimestamp
      : latestTimestamp;
    if (finalTimestamp) {
      await updateConfig({
        pull: {
          [pullConfigKey]: {
            lastPullTimestamp: finalTimestamp.toISOString(),
          },
        },
      } as Parameters<typeof updateConfig>[0]);
    }

    return NextResponse.json({
      message: `Pull complete for Welcome Day ${season}`,
      totalInOrigin: originRows.length,
      pulled: newRecords.length,
      skippedDuplicates,
      savedTimestamp: finalTimestamp?.toISOString() || null,
    });
  } catch (error) {
    console.error('Welcome Day pull error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pull records' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/Welcome-Day/pull - Get pull configuration status
 */
export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S1';
    const config = getPullConfig(season);
    const pullConfigKey = season === 'S1' ? 'welcome_day_s1' : 'welcome_day_s2';
    const lastPullTimestamp = getConfig().pull[pullConfigKey].lastPullTimestamp || null;

    return NextResponse.json({
      season,
      isActive: config.isActive,
      hasOriginSheet: !!config.originSheetId,
      hasTabName: !!config.originTabName,
      lastPullTimestamp,
    });
  } catch (error) {
    console.error('Welcome Day pull config error:', error);
    return NextResponse.json({ error: 'Failed to get pull configuration' }, { status: 500 });
  }
});

/**
 * DELETE /api/Welcome-Day/pull - Reset lastPullTimestamp (allows fresh re-pull)
 */
export const DELETE = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || 'S1';
    const pullConfigKey = season === 'S1' ? 'welcome_day_s1' : 'welcome_day_s2';

    await updateConfig({
      pull: {
        [pullConfigKey]: {
          lastPullTimestamp: '',
        },
      },
    } as Parameters<typeof updateConfig>[0]);

    return NextResponse.json({
      message: `Pull timestamp reset for Welcome Day ${season}. Next pull will import all records not already in the database.`,
    });
  } catch (error) {
    console.error('Reset timestamp error:', error);
    return NextResponse.json({ error: 'Failed to reset pull timestamp' }, { status: 500 });
  }
});
