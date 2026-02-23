// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Send Single Email API Route
 * POST /api/interviews/email/send/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getMemberById, updateMember } from '@/lib/members';
import { sendInterviewEmail, getInterviewTemplate } from '@/lib/email';

export const POST = withRole('ChairMan', async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Get member
    const member = await getMemberById(id, season);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if member has interview assignment
    if (!member.interviewDay || !member.interviewTime) {
      return NextResponse.json(
        { error: 'Member does not have interview assignment' },
        { status: 400 }
      );
    }

    // Always use default template
    const emailSubject = 'Interview Invitation - IEEE KSB';

    // Pick template based on interview mode (Online vs Physical)
    const template = getInterviewTemplate(member.interviewMode);

    // Send email
    const success = await sendInterviewEmail(
      member,
      template,
      emailSubject
    );

    if (success) {
      // Update isEmailSend
      await updateMember(id, { isEmailSend: true }, user.username, season);

      return NextResponse.json({
        message: 'Email sent successfully',
        success: true,
      });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
});
