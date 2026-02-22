// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Email Mismatches API Route
 * GET /api/welcome-day/validation/email-mismatches
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';

export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    const mismatches = attendees.filter((attendee) => {
      const email1 = attendee.emailAddress?.toLowerCase().trim();
      const email2 = attendee.email?.toLowerCase().trim();
      return email1 && email2 && email1 !== email2;
    });

    return NextResponse.json({ mismatches });
  } catch (error) {
    console.error('Email mismatches error:', error);
    return NextResponse.json({ error: 'Failed to fetch email mismatches' }, { status: 500 });
  }
});
