// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Member Stats API Route
 * GET /api/interviews/members/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { getMemberStats } from '@/lib/members';

export const GET = withRoles(['ChairMan', 'highboard'], async (request: NextRequest, _user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const stats = await getMemberStats(season);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
});
