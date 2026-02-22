// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Active Attendees API Route
 * GET /api/Welcome-Day/attendees/active - Get all attendees (Chairman only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    // Only Chairman can view all members
    if (user.role !== 'ChairMan') {
      return NextResponse.json(
        { error: 'Forbidden: Only Chairman can view all members' },
        { status: 403 }
      );
    }

    const attendees = await readAllWelcomeDayAttendees(season);

    return NextResponse.json({
      attendees,
      count: attendees.length,
    });
  } catch (error) {
    console.error('Get all attendees error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
});
