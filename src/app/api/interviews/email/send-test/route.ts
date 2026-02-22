// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Send Test Email API Route
 * POST /api/interviews/email/send-test
 * Sends test emails to TEST_EMAIL for one member from each committee
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { searchMembers } from '@/lib/members';
import { sendEmail, fillTemplate, DEFAULT_INTERVIEW_EMAIL_TEMPLATE } from '@/lib/email';
import { getConfig } from '@/lib/config';

export const POST = withRole('ChairMan', async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const TEST_EMAIL = getConfig().email.testEmail;
    if (!TEST_EMAIL) {
      return NextResponse.json(
        { error: 'TEST_EMAIL is not configured in config.json' },
        { status: 500 }
      );
    }

    // Get all members
    const allMembers = await searchMembers('', season);

    if (allMembers.length === 0) {
      return NextResponse.json({ error: 'No members found in the system' }, { status: 404 });
    }

    // Filter members with interview assignments
    const membersWithInterviews = allMembers.filter(
      (m) => m.interviewDay && m.interviewTime && m.trackApplying
    );

    if (membersWithInterviews.length === 0) {
      return NextResponse.json(
        { error: 'No members with interview assignments found' },
        { status: 404 }
      );
    }

    // Group members by committee (trackApplying)
    const committeeGroups = new Map<string, typeof membersWithInterviews>();

    for (const member of membersWithInterviews) {
      const committee = member.trackApplying || 'Unknown';
      if (!committeeGroups.has(committee)) {
        committeeGroups.set(committee, []);
      }
      committeeGroups.get(committee)!.push(member);
    }

    // Send one test email per committee
    const results: Array<{
      committee: string;
      memberName: string;
      memberId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const [committee, members] of committeeGroups.entries()) {
      // Pick the first member from this committee
      const testMember = members[0];

      try {
        // Fill template with member data
        const html = fillTemplate(DEFAULT_INTERVIEW_EMAIL_TEMPLATE, testMember);

        // Create subject with committee info
        const subject = `[TEST] Interview Invitation - IEEE KSB - ${committee}`;

        // Send to TEST_EMAIL instead of member's actual email
        const success = await sendEmail(TEST_EMAIL, subject, html);

        results.push({
          committee,
          memberName: testMember.fullName,
          memberId: testMember.id || 'N/A',
          success,
        });
      } catch (error) {
        results.push({
          committee,
          memberName: testMember.fullName,
          memberId: testMember.id || 'N/A',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} test emails, ${failedCount} failed`,
      testEmail: TEST_EMAIL,
      committees: committeeGroups.size,
      success: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
