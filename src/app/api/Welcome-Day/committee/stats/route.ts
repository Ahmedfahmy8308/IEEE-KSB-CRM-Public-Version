// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Committee Stats API Route
 * GET /api/Welcome-Day/committee/stats
 * Get statistics for a specific committee or all committees
 * Query params: committee (optional) - if provided, returns stats for that committee only
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

async function handler(request: NextRequest, user: User) {
  try {
    const { searchParams } = new URL(request.url);
    const committee = searchParams.get('committee');
    const season = searchParams.get('season') || undefined;

    const allAttendees = await readAllWelcomeDayAttendees(season);
    let filteredAttendees = allAttendees;
    let availableCommittees: string[] = [];

    // For board role, only show their committee
    if (user.role === 'board' && user.committee) {
      filteredAttendees = allAttendees.filter(
        (a) => a.committee?.toLowerCase() === user.committee?.toLowerCase()
      );
      // Board can only see their own committee
      availableCommittees = [user.committee];
    } else {
      // For ChairMan/highboard, they can see all committees
      availableCommittees = [
        ...new Set(allAttendees.filter((a) => a.committee).map((a) => a.committee!)),
      ].sort();

      // Filter by requested committee if provided
      if (committee) {
        filteredAttendees = allAttendees.filter(
          (a) => a.committee?.toLowerCase() === committee.toLowerCase()
        );
      }
    }

    // Calculate statistics
    const stats = {
      total: filteredAttendees.length,
      checked: filteredAttendees.filter((a) => a.checked?.toLowerCase() === 'passed').length,
      notChecked: filteredAttendees.filter(
        (a) => !a.checked || a.checked?.toLowerCase() === 'not checked'
      ).length,
      failed: filteredAttendees.filter((a) => a.checked?.toLowerCase() === 'failed').length,
      attended: filteredAttendees.filter((a) => a.attended?.toLowerCase() === 'true').length,
      notAttended: filteredAttendees.filter(
        (a) => !a.attended || a.attended?.toLowerCase() === 'false'
      ).length,
      hasQrCode: filteredAttendees.filter((a) => a.qrCode && a.qrCode.trim() !== '').length,
      emailSent: filteredAttendees.filter((a) => a.isEmailSend === true).length,
      hasNotes: filteredAttendees.filter((a) => a.note && a.note.trim() !== '').length,
      // Validation status counts
      validationPassed: filteredAttendees.filter((a) => a.checked?.toLowerCase() === 'passed')
        .length,
      validationNotChecked: filteredAttendees.filter(
        (a) => !a.checked || a.checked?.toLowerCase() === 'not checked'
      ).length,
      validationFailed: filteredAttendees.filter((a) => a.checked?.toLowerCase() === 'failed')
        .length,
      // Payment method counts
      paymentInstapay: filteredAttendees.filter(
        (a) => a.paymentMethod?.toLowerCase() === 'instapay'
      ).length,
      paymentVodafoneCash: filteredAttendees.filter(
        (a) => a.paymentMethod?.toLowerCase() === 'vodafone cash'
      ).length,
      // QR codes generated count
      qrCodesGenerated: filteredAttendees.filter((a) => a.qrCode && a.qrCode.trim() !== '').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      committees: availableCommittees,
      committee: user.role === 'board' ? user.committee : committee || 'all',
    });
  } catch (error: unknown) {
    console.error('Error fetching Welcome-Day committee stats:', error);
    return NextResponse.json({ error: 'Failed to fetch committee statistics' }, { status: 500 });
  }
}

export const GET = withRoles(['ChairMan', 'highboard', 'board'], handler);
