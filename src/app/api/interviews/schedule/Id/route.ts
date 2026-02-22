// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Generate IDs API Route
 * POST /api/interviews/schedule/Id
 * Generates and assigns IDs to members without IDs (doesn't assign interview schedule)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { batchUpdateMembersByRowIndex } from '@/lib/members';
import { generateMultipleUniqueIds } from '@/lib/id';
import { readAllRows, ApplicantRow } from '@/lib/sheets';

export const POST = withRole('ChairMan', async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    // Get all members and filter those without IDs
    const allMembers = await readAllRows(season);
    const membersWithoutIds = allMembers.filter((m) => !m.id || m.id.trim() === '');

    if (membersWithoutIds.length === 0) {
      return NextResponse.json({
        message: 'No members without IDs found',
        generated: 0,
      });
    }

    // Generate unique IDs for all members without IDs
    const newIds = await generateMultipleUniqueIds(membersWithoutIds.length, undefined, season);

    // Prepare batch updates
    const batchUpdates: Array<{ rowIndex: number; updates: Partial<ApplicantRow>; actor: string }> =
      [];

    for (let i = 0; i < membersWithoutIds.length; i++) {
      const member = membersWithoutIds[i];
      const newId = newIds[i];

      if (!member.rowIndex) {
        console.error(`Member ${member.fullName} has no rowIndex`);
        continue;
      }

      batchUpdates.push({
        rowIndex: member.rowIndex,
        updates: {
          id: newId,
        },
        actor: user.username,
      });
    }

    // Perform batch update
    const successCount = await batchUpdateMembersByRowIndex(batchUpdates, season);

    // Build results
    const results = batchUpdates.map((update, i) => ({
      name: membersWithoutIds[i].fullName,
      email: membersWithoutIds[i].email,
      id: newIds[i],
    }));

    return NextResponse.json({
      message: `Successfully generated ${successCount} IDs`,
      generated: successCount,
      total: membersWithoutIds.length,
      results,
    });
  } catch (error) {
    console.error('Generate IDs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate IDs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
