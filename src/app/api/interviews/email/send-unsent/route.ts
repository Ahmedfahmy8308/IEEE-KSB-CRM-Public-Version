// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Send Unsent Emails API Route
 * POST /api/interviews/email/send-unsent
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getMembersWithoutEmails, batchUpdateMembers } from '@/lib/members';
import {
  sendBatchEmails,
  DEFAULT_INTERVIEW_EMAIL_TEMPLATE,
  ONLINE_INTERVIEW_EMAIL_TEMPLATE,
} from '@/lib/email';

export const POST = withRole('ChairMan', async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const emailSubject = 'Interview Invitation - IEEE KSB';

    // Get members without emails sent
    const members = await getMembersWithoutEmails(season);

    if (members.length === 0) {
      return NextResponse.json({
        message: 'No unsent emails found',
        sent: 0,
      });
    }

    // Filter members with interview assignments
    const membersWithInterviews = members.filter((m) => m.interviewDay && m.interviewTime);

    if (membersWithInterviews.length === 0) {
      return NextResponse.json({
        message: 'No members with interview assignments found',
        sent: 0,
      });
    }

    // Split members by interview mode (Online vs Physical)
    const physicalMembers = membersWithInterviews.filter(
      (m) => (m.interviewMode || '').trim() !== 'Online'
    );
    const onlineMembers = membersWithInterviews.filter(
      (m) => (m.interviewMode || '').trim() === 'Online'
    );

    // Send emails in batches — physical members with default template
    let totalSuccess = 0;
    let totalFailed = 0;
    const allResults: Array<{ id: string; success: boolean; email: string }> = [];

    if (physicalMembers.length > 0) {
      const physicalResult = await sendBatchEmails(
        physicalMembers,
        DEFAULT_INTERVIEW_EMAIL_TEMPLATE,
        emailSubject
      );
      totalSuccess += physicalResult.success;
      totalFailed += physicalResult.failed;
      allResults.push(...physicalResult.results);
    }

    // Send emails in batches — online members with online template
    if (onlineMembers.length > 0) {
      const onlineResult = await sendBatchEmails(
        onlineMembers,
        ONLINE_INTERVIEW_EMAIL_TEMPLATE,
        emailSubject
      );
      totalSuccess += onlineResult.success;
      totalFailed += onlineResult.failed;
      allResults.push(...onlineResult.results);
    }

    // Batch update isEmailSend for successful sends
    const successfulUpdates = allResults
      .filter((r) => r.success)
      .map((r) => ({
        id: r.id,
        updates: { isEmailSend: true },
      }));

    if (successfulUpdates.length > 0) {
      await batchUpdateMembers(successfulUpdates, user.username, season);
    }

    return NextResponse.json({
      message: `Sent ${totalSuccess} emails (${physicalMembers.length} physical, ${onlineMembers.length} online), ${totalFailed} failed`,
      success: totalSuccess,
      failed: totalFailed,
      results: allResults,
    });
  } catch (error) {
    console.error('Send unsent emails error:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
});
