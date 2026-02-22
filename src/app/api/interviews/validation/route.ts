// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * All Validations API Route
 * GET /api/interviews/validation
 * Returns all validation results in one call
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllRows } from '@/lib/sheets';
import { runAllValidations } from '@/lib/validation';

export const GET = withRoles(['ChairMan', 'highboard'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const applicants = await readAllRows(season);
    const validations = runAllValidations(applicants);

    return NextResponse.json({
      validations,
      summary: {
        duplicatePhones: validations.duplicatePhones.length,
        duplicateEmails: validations.duplicateEmails.length,
        duplicateEmailAddresses: validations.duplicateEmailAddresses.length,
        emailMismatches: validations.emailMismatches.length,
        totalIssues:
          validations.duplicatePhones.length +
          validations.duplicateEmails.length +
          validations.duplicateEmailAddresses.length +
          validations.emailMismatches.length,
      },
      message: 'All validations completed',
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Failed to run validations' }, { status: 500 });
  }
});
