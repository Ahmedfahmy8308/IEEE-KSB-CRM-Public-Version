// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { getApplicantsByCommittee } from '@/lib/sheets';
import type { User } from '@/lib/auth';

/**
 * GET /api/interviews/committee/members
 * Get members for a specific committee
 * Query params: committee (required) - committee name
 */
async function handler(request: NextRequest, user: User) {
  try {
    const { searchParams } = new URL(request.url);
    let committee = searchParams.get('committee');
    const season = searchParams.get('season') || undefined;

    // For board role, override with their committee
    if (user.role === 'board' && user.committee) {
      committee = user.committee;
    }

    if (!committee) {
      return NextResponse.json({ error: 'Committee parameter is required' }, { status: 400 });
    }

    const committeeMembers = await getApplicantsByCommittee(committee, season);

    return NextResponse.json({
      success: true,
      members: committeeMembers,
      count: committeeMembers.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching committee members:', error);
    return NextResponse.json({ error: 'Failed to fetch committee members' }, { status: 500 });
  }
}

export const GET = withRoles(['ChairMan', 'highboard', 'board'], handler);
