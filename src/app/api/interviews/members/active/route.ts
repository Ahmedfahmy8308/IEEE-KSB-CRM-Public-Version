// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * API Route: Get Active Interview Members
 * Returns members who are currently waiting in reception or in interview
 */

import { NextRequest, NextResponse } from 'next/server';
import { readAllRows } from '@/lib/sheets';
import { INTERVIEW_STATE } from '@/lib/constants';
import { withRoles } from '@/lib/middleware';

export const GET = withRoles(
  ['ChairMan', 'highboard', 'board'],
  async (request: NextRequest, user) => {
    try {
      const season = request.nextUrl.searchParams.get('season') || undefined;
      // Get all members
      const allMembers = await readAllRows(season);

      // Filter members who are waiting in reception or in interview
      let activeMembers = allMembers.filter(
        (member) =>
          member.state === INTERVIEW_STATE.WAIT_IN_RECEPTION ||
          member.state === INTERVIEW_STATE.IN_INTERVIEW
      );

      // If user is board member, filter by their committee
      if (user.role === 'board' && user.committee) {
        activeMembers = activeMembers.filter((member) => member.trackApplying === user.committee);
      }

      // Sort by state (In Interview first, then Wait in Reception) and then by time
      activeMembers.sort((a, b) => {
        // First sort by state priority
        if (a.state === INTERVIEW_STATE.IN_INTERVIEW && b.state !== INTERVIEW_STATE.IN_INTERVIEW) {
          return -1;
        }
        if (a.state !== INTERVIEW_STATE.IN_INTERVIEW && b.state === INTERVIEW_STATE.IN_INTERVIEW) {
          return 1;
        }

        // Then sort by interview time if available
        if (a.interviewTime && b.interviewTime) {
          return a.interviewTime.localeCompare(b.interviewTime);
        }

        return 0;
      });

      return NextResponse.json({ members: activeMembers }, { status: 200 });
    } catch (error) {
      console.error('Error fetching active members:', error);
      return NextResponse.json({ error: 'Failed to fetch active members' }, { status: 500 });
    }
  }
);
