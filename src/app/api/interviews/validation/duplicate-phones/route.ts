// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Duplicate Phones Validation API Route
 * GET /api/interviews/validation/duplicate-phones
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllRows } from '@/lib/sheets';
import { findDuplicatePhones } from '@/lib/validation';

export const GET = withRoles(['ChairMan', 'highboard'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const applicants = await readAllRows(season);
    const duplicates = findDuplicatePhones(applicants);

    return NextResponse.json({
      duplicates,
      count: duplicates.length,
      message:
        duplicates.length > 0
          ? `Found ${duplicates.length} duplicate phone numbers`
          : 'No duplicate phone numbers found',
    });
  } catch (error) {
    console.error('Duplicate phones validation error:', error);
    return NextResponse.json({ error: 'Failed to check duplicate phones' }, { status: 500 });
  }
});
