// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Mark Attendance API Route
 * POST /api/Welcome-Day/attendance/mark
 * Mark attendance for an attendee (ChairMan only)
 * Body: { ticketId: string } or { attendeeId: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees, updateWelcomeDayAttendee } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

async function handler(request: NextRequest, user: User) {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const body = await request.json();
    const { ticketId, attendeeId } = body;

    if (!ticketId && !attendeeId) {
      return NextResponse.json(
        { error: 'Either ticketId or attendeeId is required' },
        { status: 400 }
      );
    }

    const attendees = await readAllWelcomeDayAttendees(season);
    let attendee;

    // Find by ticket ID (QR code) or attendee ID (row index)
    if (ticketId) {
      attendee = attendees.find((a) => a.qrCode?.toLowerCase() === ticketId.toLowerCase());
    } else if (attendeeId) {
      const rowIndex = parseInt(String(attendeeId), 10);
      if (!isNaN(rowIndex)) {
        attendee = attendees.find((a) => a.rowIndex === rowIndex);
      }
    }

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    // Check if already attended
    if (attendee.attended?.toLowerCase() === 'true') {
      return NextResponse.json({
        success: false,
        message: 'Attendee already marked as attended',
        attendee,
      });
    }

    // Mark as attended
    const timestamp = new Date().toISOString();
    const updatedAttendee = {
      ...attendee,
      attended: 'true',
      log: `${attendee.log || ''}\n[${timestamp}] Marked as attended by ${user.username}`.trim(),
    };

    await updateWelcomeDayAttendee(attendee.rowIndex!, updatedAttendee, season);

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendee: updatedAttendee,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}

export const POST = withRoles(['ChairMan'], handler);
