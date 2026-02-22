// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Members Search API Route
 * GET /api/interviews/members/search?q=query
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { searchMembers } from '@/lib/members';
import { canAccessMember } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const season = searchParams.get('season') || undefined;

    // Search members
    let members = await searchMembers(query, season);

    // Filter by committee access for board members
    if (user.role === 'board') {
      members = members.filter((m) => canAccessMember(user, m.trackApplying || ''));
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
});
