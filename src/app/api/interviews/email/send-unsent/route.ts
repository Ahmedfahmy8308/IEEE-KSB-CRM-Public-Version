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
import { sendBatchEmails, DEFAULT_INTERVIEW_EMAIL_TEMPLATE } from '@/lib/email';

export const POST = withRole('ChairMan', async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    // Always use default template
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

    // Send emails in batches
    const result = await sendBatchEmails(
      membersWithInterviews,
      DEFAULT_INTERVIEW_EMAIL_TEMPLATE,
      emailSubject
    );

    // Batch update isEmailSend for successful sends
    // This uses only 2 API calls total (1 read, 1 batch write) instead of 500+
    const successfulUpdates = result.results
      .filter((r) => r.success)
      .map((r) => ({
        id: r.id,
        updates: { isEmailSend: true },
      }));

    if (successfulUpdates.length > 0) {
      await batchUpdateMembers(successfulUpdates, user.username, season);
    }

    return NextResponse.json({
      message: `Sent ${result.success} emails, ${result.failed} failed`,
      success: result.success,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    console.error('Send unsent emails error:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
});
