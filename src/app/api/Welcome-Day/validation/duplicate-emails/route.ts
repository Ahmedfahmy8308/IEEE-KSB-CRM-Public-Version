// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Duplicate Emails Validation API Route
 * GET /api/welcome-day/validation/duplicate-emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';

export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    // Group attendees by email (not emailAddress)
    const emailMap = new Map<string, typeof attendees>();

    attendees.forEach((attendee) => {
      const email = attendee.email?.toLowerCase().trim();
      if (email) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(attendee);
      }
    });

    // Filter to only include duplicates (2 or more attendees with same email)
    const duplicates: Array<{
      email: string;
      members: Array<{
        fullName: string;
        emailAddress: string;
        phoneNumber: string;
        committee: string;
      }>;
    }> = [];

    for (const [email, group] of emailMap.entries()) {
      if (group.length > 1) {
        duplicates.push({
          email,
          members: group.map((attendee) => ({
            fullName: attendee.fullName || 'Unknown',
            emailAddress: attendee.emailAddress || 'N/A',
            phoneNumber: attendee.phoneNumber || 'N/A',
            committee: attendee.committee || 'N/A',
          })),
        });
      }
    }

    return NextResponse.json({
      duplicates,
      count: duplicates.length,
      message:
        duplicates.length > 0
          ? `Found ${duplicates.length} duplicate emails`
          : 'No duplicate emails found',
    });
  } catch (error) {
    console.error('Duplicate emails validation error:', error);
    return NextResponse.json({ error: 'Failed to check duplicate emails' }, { status: 500 });
  }
});
