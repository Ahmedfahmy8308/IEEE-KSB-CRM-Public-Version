// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Email Mismatches Quick Fix API Route
 * POST /api/interviews/validation/email-mismatches/quick-fix
 * Sets each mismatched member's Contact Email to match their Form Email
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllRows } from '@/lib/sheets';
import { findEmailsMismatchEmailAddress } from '@/lib/validation';
import { batchUpdateMembers } from '@/lib/members';

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    // Find all mismatches
    const applicants = await readAllRows(season);
    const mismatches = findEmailsMismatchEmailAddress(applicants);

    if (mismatches.length === 0) {
      return NextResponse.json({
        fixed: 0,
        message: 'No email mismatches to fix',
      });
    }

    // Build batch updates: set email (Contact Email) = emailAddress (Form Email)
    const memberUpdates = mismatches.map((m) => ({
      id: m.id,
      updates: { email: m.emailAddress },
    }));

    const results = await batchUpdateMembers(memberUpdates, 'system', season);

    const fixed = results.filter((r) => r !== null).length;
    const failed = results.filter((r) => r === null).length;

    return NextResponse.json({
      fixed,
      failed,
      total: mismatches.length,
      message: `Fixed ${fixed} email mismatches${failed > 0 ? ` (${failed} failed)` : ''}`,
    });
  } catch (error) {
    console.error('Email mismatches quick fix error:', error);
    return NextResponse.json({ error: 'Failed to fix email mismatches' }, { status: 500 });
  }
});
