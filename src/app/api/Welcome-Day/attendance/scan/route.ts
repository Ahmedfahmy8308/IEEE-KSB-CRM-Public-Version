// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

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

    // Mark as attended
    const timestamp = new Date().toISOString();
    const updatedAttendee = {
      ...attendee,
      attended: 'true',
      log: `${attendee.log || ''}\n[${timestamp}] Marked as attended via QR scan by ${user.username}`.trim(),
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
