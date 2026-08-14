// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Scan QR Code API Route
 * POST /api/Welcome-Day/attendance/scan
 * Scan QR code and mark attendance (ChairMan only)
 * Body: { qrCode: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees, updateWelcomeDayAttendee } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';
import {
  appendSheetLogEntry,
  buildSheetUpdateLogEntry,
  collectSheetFieldChanges,
} from '@/lib/sheets/logging';

async function handler(request: NextRequest, user: User) {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode || typeof qrCode !== 'string' || qrCode.trim() === '') {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    const attendees = await readAllWelcomeDayAttendees(season);
    const attendee = attendees.find((a) => a.qrCode?.toLowerCase() === qrCode.toLowerCase().trim());

    if (!attendee) {
      return NextResponse.json({ error: 'Invalid QR code - attendee not found' }, { status: 404 });
    }

    // Check if already attended
    if (attendee.attended?.toLowerCase() === 'true') {
      return NextResponse.json({
        success: true,
        alreadyAttended: true,
        message: `${attendee.fullName} is already marked as attended`,
        attendee,
      });
    }

    const changes = collectSheetFieldChanges(
      attendee,
      { attended: 'true' },
      {
        ignoreFields: ['rowIndex', 'log'],
      }
    );
    const logEntry = buildSheetUpdateLogEntry({
      actor: {
        name: user.name || user.username,
        email: user.username,
      },
      changes,
      action: 'marked attendance via qr',
    });

    // Mark as attended
    const updatedAttendee = {
      ...attendee,
      attended: 'true',
      log: appendSheetLogEntry(attendee.log, logEntry),
    };

    await updateWelcomeDayAttendee(attendee.rowIndex!, updatedAttendee, season);

    return NextResponse.json({
      success: true,
      alreadyAttended: false,
      message: `${attendee.fullName} marked as attended successfully`,
      attendee: updatedAttendee,
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    return NextResponse.json({ error: 'Failed to scan QR code' }, { status: 500 });
  }
}

export const POST = withRoles(['ChairMan'], handler);
