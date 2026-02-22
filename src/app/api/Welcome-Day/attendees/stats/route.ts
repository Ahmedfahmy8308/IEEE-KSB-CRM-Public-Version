// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { getAttendeeStats } from '@/lib/welcomeDay';

/**
 * GET /api/Welcome-Day/attendees/stats
 * Get statistics about all Welcome Day attendees
 */
export const GET = withRoles(['ChairMan', 'highboard'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    // Use optimized stats function - reads data once and calculates in memory
    const stats = await getAttendeeStats(season);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error getting attendee stats:', error);
    return NextResponse.json({ error: 'Failed to get attendee statistics' }, { status: 500 });
  }
});
