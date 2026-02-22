// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Email Mismatches Validation API Route
 * GET /api/interviews/validation/email-mismatches
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllRows } from '@/lib/sheets';
import { findEmailsMismatchEmailAddress } from '@/lib/validation';

export const GET = withRoles(['ChairMan', 'highboard'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const applicants = await readAllRows(season);
    const mismatches = findEmailsMismatchEmailAddress(applicants);

    return NextResponse.json({
      mismatches,
      count: mismatches.length,
      message:
        mismatches.length > 0
          ? `Found ${mismatches.length} email mismatches between email and emailAddress fields`
          : 'No email mismatches found',
    });
  } catch (error) {
    console.error('Email mismatches validation error:', error);
    return NextResponse.json({ error: 'Failed to check email mismatches' }, { status: 500 });
  }
});
