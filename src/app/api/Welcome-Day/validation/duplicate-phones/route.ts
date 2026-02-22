// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Duplicate Phones API Route
 * GET /api/welcome-day/validation/duplicate-phones
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';

export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    const phoneMap = new Map<string, typeof attendees>();
    const duplicates: typeof attendees = [];

    attendees.forEach((attendee) => {
      const phone = attendee.phoneNumber?.trim();
      if (phone) {
        if (phoneMap.has(phone)) {
          const existing = phoneMap.get(phone)!;
          if (!duplicates.includes(existing[0])) {
            duplicates.push(...existing);
          }
          duplicates.push(attendee);
        } else {
          phoneMap.set(phone, [attendee]);
        }
      }
    });

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('Duplicate phones error:', error);
    return NextResponse.json({ error: 'Failed to fetch duplicate phones' }, { status: 500 });
  }
});
