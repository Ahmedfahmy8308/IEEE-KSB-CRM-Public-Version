// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Send Test Email API Route
 * POST /api/welcome-day/email/send-test - Send test emails (one per committee)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { sendWelcomeDayEmail, DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE } from '@/lib/email';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';
import { getConfig } from '@/lib/config';

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    // Try to get email from request body, fallback to TEST_EMAIL from config
    const body = await request.json().catch(() => ({}));
    const TEST_EMAIL = getConfig().email.testEmail;
    const testEmail = body?.email || TEST_EMAIL;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'TEST_EMAIL is not configured in config.json and no email provided' },
        { status: 500 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get all attendees
    const allAttendees = await readAllWelcomeDayAttendees(season);

    if (allAttendees.length === 0) {
      return NextResponse.json({ error: 'No attendees found in the system' }, { status: 404 });
    }

    // Filter attendees with QR codes
    const attendeesWithQR = allAttendees.filter((a) => a.qrCode && a.qrCode.trim() !== '');

    if (attendeesWithQR.length === 0) {
      return NextResponse.json({ error: 'No attendees with QR codes found' }, { status: 404 });
    }

    // Group attendees by committee
    const committeeGroups = new Map<string, typeof attendeesWithQR>();

    for (const attendee of attendeesWithQR) {
      const committee = attendee.committee || 'Unknown';
      if (!committeeGroups.has(committee)) {
        committeeGroups.set(committee, []);
      }
      committeeGroups.get(committee)!.push(attendee);
    }

    // Send one test email per committee
    const results: Array<{
      committee: string;
      attendeeName: string;
      qrCode: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const [committee, attendees] of committeeGroups.entries()) {
      // Pick the first attendee from this committee
      const testAttendee = attendees[0];

      try {
        // Create subject with committee info
        const subject = `[TEST] Welcome Day Confirmation - IEEE KSB - ${committee}`;

        // Send to TEST_EMAIL instead of attendee's actual email
        // QR code image will be attached directly to the email
        const success = await sendWelcomeDayEmail(
          testEmail,
          subject,
          DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE,
          {
            fullName: testAttendee.fullName,
            committee: testAttendee.committee,
            qrCode: testAttendee.qrCode,
          }
        );

        results.push({
          committee,
          attendeeName: testAttendee.fullName,
          qrCode: testAttendee.qrCode || 'N/A',
          success,
        });
      } catch (error) {
        results.push({
          committee,
          attendeeName: testAttendee.fullName,
          qrCode: testAttendee.qrCode || 'N/A',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} test emails, ${failedCount} failed`,
      testEmail,
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
