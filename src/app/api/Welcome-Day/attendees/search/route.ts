// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Search API Route
 * GET /api/Welcome-Day/attendees/search?q=query
 * Search by name, email, phone number, or ticket ID (QR code)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const season = searchParams.get('season') || undefined;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const allAttendees = await readAllWelcomeDayAttendees(season);
    const normalizedQuery = query.toLowerCase().trim();

    // Search across multiple fields
    let results = allAttendees.filter((attendee) => {
      const matchesName = attendee.fullName?.toLowerCase().includes(normalizedQuery);
      const matchesEmail =
        attendee.emailAddress?.toLowerCase().includes(normalizedQuery) ||
        attendee.email?.toLowerCase().includes(normalizedQuery);
      const matchesPhone = attendee.phoneNumber?.includes(normalizedQuery);
      const matchesTicket = attendee.qrCode?.toLowerCase().includes(normalizedQuery);

      return matchesName || matchesEmail || matchesPhone || matchesTicket;
    });

    // For board users, only return members of their committee
    if (user.role === 'board' && user.committee) {
      results = results.filter((a) => a.committee?.toLowerCase() === user.committee?.toLowerCase());
    }

    // Determine if user can view sensitive data (only ChairMan can)
    const canViewSensitive = user.role === 'ChairMan';

    // Filter sensitive data based on role
    const safeResults = results.map((attendee) => {
      if (canViewSensitive) {
        // Chairman can see everything
        return attendee;
      } else {
        // Board and highboard cannot see nationalId and paymentScreenshot

        const {
          paymentScreenshot: _paymentScreenshot,
          nationalId: _nationalId,
          ...safeAttendee
        } = attendee;
        return safeAttendee;
      }
    });

    return NextResponse.json({
      success: true,
      attendees: safeResults,
      count: safeResults.length,
      canViewSensitiveData: canViewSensitive,
    });
  } catch (error) {
    console.error('Welcome-Day search error:', error);
    return NextResponse.json({ error: 'Failed to search attendees' }, { status: 500 });
  }
});
