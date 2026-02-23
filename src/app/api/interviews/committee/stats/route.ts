// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllRows, getApplicantsByCommittee } from '@/lib/sheets';
import { calculateMemberStats } from '@/lib/members';
import type { User } from '@/lib/auth';

/**
 * GET /api/interviews/committee/stats
 * Get statistics for a specific committee or all committees
 * Query params: committee (optional) - if provided, returns stats for that committee only
 * Query params: date (optional) - filter by specific date (YYYY-MM-DD format)
 */
async function handler(request: NextRequest, user: User) {
  try {
    const { searchParams } = new URL(request.url);
    const committee = searchParams.get('committee');
    const date = searchParams.get('date');
    const season = searchParams.get('season') || undefined;

    const allMembers = await readAllRows(season);
    let filteredMembers = allMembers;

    // For board role, only show their committee
    if (user.role === 'board' && user.committee) {
      filteredMembers = await getApplicantsByCommittee(user.committee, season);
    } else if (committee) {
      // For ChairMan/highboard, filter by requested committee
      filteredMembers = await getApplicantsByCommittee(committee, season);
    }

    // Filter by date if specified
    if (date) {
      filteredMembers = filteredMembers.filter((m) => m.interviewDay === date);
    }

    // Calculate stats using centralized function
    const fullStats = calculateMemberStats(filteredMembers);

    // Count rejected and not started
    let rejected = 0;
    let notStarted = 0;
    let notAttended = 0;
    let pendingApproval = 0;

    for (const member of filteredMembers) {
      // Count rejected
      if (member.approved === 'rejected' || member.approved === 'Rejected') {
        rejected++;
      }

      // Count not started interviews
      if (!member.state || member.state === 'Not Started') {
        notStarted++;
      }

      // Count not attended interviews
      if (member.state === 'Not Attended') {
        notAttended++;
      }

      // Count pending approval
      if (member.approved === 'pending' || !member.approved || member.approved === '') {
        pendingApproval++;
      }
    }

    const stats = {
      total: fullStats.total,
      assigned: fullStats.assigned,
      emailSent: fullStats.emailSent,
      approvedEmailSent: fullStats.approvedEmailSent,
      approved: fullStats.approved,
      rejected: rejected,
      pendingApproval: pendingApproval,
      completed: fullStats.completed,
      notStarted: notStarted,
      notAttended: notAttended,
      inProgress: fullStats.inProgress,
      pending: fullStats.pending,
      idMatched: fullStats.idMatched,
      idNew: fullStats.idNew,
      idMismatch: fullStats.idMismatch,
      idNeedReview: fullStats.idNeedReview,
      physical: fullStats.physical,
      online: fullStats.online,
    };

    // Get unique interview dates for this committee
    const interviewDates = [
      ...new Set(filteredMembers.filter((m) => m.interviewDay).map((m) => m.interviewDay)),
    ].sort();

    return NextResponse.json({
      success: true,
      stats,
      interviewDates,
      committee: committee || 'all',
    });
  } catch (error: unknown) {
    console.error('Error fetching committee stats:', error);
    return NextResponse.json({ error: 'Failed to fetch committee statistics' }, { status: 500 });
  }
}

export const GET = withRoles(['ChairMan', 'highboard', 'board'], handler);
