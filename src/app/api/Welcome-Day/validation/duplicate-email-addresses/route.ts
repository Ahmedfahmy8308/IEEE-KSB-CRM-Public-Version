// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Duplicate Emails API Route
 * GET /api/welcome-day/validation/duplicate-emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';

export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    const emailMap = new Map<string, typeof attendees>();
    const duplicates: typeof attendees = [];

    attendees.forEach((attendee) => {
      const email = attendee.emailAddress?.toLowerCase().trim();
      if (email) {
        if (emailMap.has(email)) {
          const existing = emailMap.get(email)!;
          if (!duplicates.includes(existing[0])) {
            duplicates.push(...existing);
          }
          duplicates.push(attendee);
        } else {
          emailMap.set(email, [attendee]);
        }
      }
    });

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('Duplicate emails error:', error);
    return NextResponse.json({ error: 'Failed to fetch duplicate emails' }, { status: 500 });
  }
});
