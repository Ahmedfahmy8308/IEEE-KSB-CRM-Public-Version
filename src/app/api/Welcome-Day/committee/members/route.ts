// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Committee Members API Route
 * GET /api/Welcome-Day/committee/members
 * Get members for a specific committee
 * Query params: committee (required) - committee name
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

async function handler(request: NextRequest, user: User) {
  try {
    const { searchParams } = new URL(request.url);
    let committee = searchParams.get('committee');
    const season = searchParams.get('season') || undefined;

    // For board role, they can only access their own committee
    if (user.role === 'board') {
      if (!user.committee) {
        return NextResponse.json(
          { error: 'Board user has no assigned committee' },
          { status: 403 }
        );
      }
      // Override any committee parameter with their own committee
      committee = user.committee;
    } else {
      // For ChairMan/highboard, committee parameter is required
      if (!committee) {
        return NextResponse.json({ error: 'Committee parameter is required' }, { status: 400 });
      }
    }

    const allAttendees = await readAllWelcomeDayAttendees(season);
    const committeeMembers = allAttendees.filter(
      (a) => a.committee?.toLowerCase() === committee?.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      members: committeeMembers,
      count: committeeMembers.length,
      committee: committee,
    });
  } catch (error: unknown) {
    console.error('Error fetching Welcome-Day committee members:', error);
    return NextResponse.json({ error: 'Failed to fetch committee members' }, { status: 500 });
  }
}

export const GET = withRoles(['ChairMan', 'highboard', 'board'], handler);
