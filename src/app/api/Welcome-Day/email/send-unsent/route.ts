// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Send Email to Unsent Attendees API Route
 * POST /api/welcome-day/email/send-unsent - Send emails to all who haven't received yet
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import {
  readAllWelcomeDayAttendees,
  batchUpdateWelcomeDayAttendees,
} from '@/lib/sheets/welcomeDay';
import {
  sendWelcomeDayEmail,
  DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE,
  closeWelcomeDayTransporter,
} from '@/lib/email';

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    // Find attendees who haven't received emails and have QR codes
    const unsentAttendees = attendees.filter(
      (a) => !a.isEmailSend && a.qrCode && a.qrCode.trim() !== '' && (a.emailAddress || a.email)
    );

    if (unsentAttendees.length === 0) {
      return NextResponse.json({
        message: 'No attendees found who need emails',
        sent: 0,
      });
    }

    console.log(`📧 Preparing to send Welcome Day emails to ${unsentAttendees.length} attendees`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Configure batch settings for Welcome Day emails (with attachments, we need to be more conservative)
    const BATCH_SIZE = 5; // Smaller batches due to QR code attachments
    const BATCH_DELAY_MS = 5000; // 5 seconds between batches to avoid rate limiting

    const totalBatches = Math.ceil(unsentAttendees.length / BATCH_SIZE);
    console.log(
      `⚙️  Batch configuration: ${BATCH_SIZE} emails per batch, ${BATCH_DELAY_MS / 1000}s delay`
    );
    console.log(`📦 Total batches: ${totalBatches}`);

    // Process in batches
    for (let i = 0; i < unsentAttendees.length; i += BATCH_SIZE) {
      const batch = unsentAttendees.slice(i, i + BATCH_SIZE);
      const currentBatchNumber = Math.floor(i / BATCH_SIZE) + 1;

      console.log(
        `\n📦 Batch ${currentBatchNumber}/${totalBatches}: Processing ${batch.length} emails...`
      );

      // Send emails in current batch sequentially (due to attachments)
      const updates = [];

      for (const attendee of batch) {
        const email = attendee.emailAddress || attendee.email;

        if (!email) continue;

        try {
          // QR code image will be attached directly to the email
          const success = await sendWelcomeDayEmail(
            email,
            'Welcome Day Confirmation - IEEE KSB',
            DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE,
            {
              fullName: attendee.fullName,
              committee: attendee.committee,
              qrCode: attendee.qrCode,
            }
          );

          if (success) {
            updates.push({
              rowIndex: attendee.rowIndex!,
              data: {
                ...attendee,
                isEmailSend: true,
              },
            });
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`Failed to send to ${email}: Email send failed`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to send to ${email}: ${error}`);
          console.error(`Failed to send email to ${email}:`, error);
        }
      }

      // Update the sheet for this batch
      if (updates.length > 0) {
        await batchUpdateWelcomeDayAttendees(updates, season);
        console.log(`   💾 Updated ${updates.length} records in sheet`);
      }

      console.log(
        `   ✅ Batch ${currentBatchNumber} complete: ${updates.length} sent, ${batch.length - updates.length} failed`
      );

      // Wait before next batch (except for the last batch)
      if (i + BATCH_SIZE < unsentAttendees.length) {
        console.log(`   ⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`\n✨ Email sending complete!`);
    console.log(`   📊 Total: ${unsentAttendees.length} emails`);
    console.log(`   ✅ Success: ${results.sent}`);
    console.log(`   ❌ Failed: ${results.failed}`);

    // Close the transporter connection pool
    closeWelcomeDayTransporter();

    return NextResponse.json({
      message: `Emails sent: ${results.sent}, Failed: ${results.failed}`,
      results,
    });
  } catch (error) {
    console.error('Send unsent emails error:', error);

    // Ensure transporter is closed even on error
    closeWelcomeDayTransporter();

    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
});
