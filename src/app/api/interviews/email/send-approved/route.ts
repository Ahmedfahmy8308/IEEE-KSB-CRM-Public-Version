// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * API Route: Send Approved/Rejected Emails
 * POST /api/interviews/email/send-approved
 *
 * Sends acceptance or rejection emails to members based on their approval status
 * Only sends to members who completed their interview
 * Uses batch sending and batch updates to avoid blocking and quota limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { readAllRows } from '@/lib/sheets';
import { batchUpdateMembers } from '@/lib/members';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';
import { getConfig } from '@/lib/config';
import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || true;
const EMAIL_USER = process.env.SMTP_USER || process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS!;
const EMAIL_FROM = process.env.EMAIL_FROM || `IEEE KSB <${EMAIL_USER}>`;

// Delay configuration (delay between each email in milliseconds)
function getEmailBatchDelay() {
  return getConfig().email.batchDelayMs;
}

// Load WhatsApp groups from CSV
function loadWhatsAppGroups(): Map<string, string> {
  const csvPath = path.join(process.cwd(), 'templates', 'WhatsAppGroup.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const groupMap = new Map<string, string>();
  const lines = csvContent.split('\n').filter((line) => line.trim());

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma and trim
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      const committee = parts[0];
      const link = parts[1];
      if (committee && link) {
        groupMap.set(committee.toLowerCase(), link);
      }
    }
  }

  return groupMap;
}

// Load email templates
function loadTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'templates', templateName);
  return fs.readFileSync(templatePath, 'utf-8');
}

// Replace placeholders in template
function fillTemplate(
  template: string,
  data: {
    firstName?: string;
    committee?: string;
    committeeLink?: string;
  }
): string {
  let filled = template;

  if (data.firstName) {
    filled = filled.replace(/{FIRST_NAME}/g, data.firstName);
    filled = filled.replace(/{{FIRST_NAME}}/g, data.firstName);
  }

  if (data.committee) {
    filled = filled.replace(/{COMMITTEE}/g, data.committee);
    filled = filled.replace(/{{COMMITTEE}}/g, data.committee);
  }

  if (data.committeeLink) {
    filled = filled.replace(/{COMMITTEE_LINK}/g, data.committeeLink);
  }

  return filled;
}

export async function POST(request: NextRequest) {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const body = await request.json();
    const { status } = body; // 'approved', 'rejected', or 'all'

    // Validate status
    if (!['approved', 'rejected', 'all'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: approved, rejected, or all' },
        { status: 400 }
      );
    }

    // Load WhatsApp groups
    const whatsAppGroups = loadWhatsAppGroups();

    // Load templates
    const approvedTemplate = loadTemplate('accepted_committee.html');
    const rejectedTemplate = loadTemplate('rejected_committee.html');

    // Get all members who completed interview
    const allRows = await readAllRows(season);
    const completedMembers = allRows.filter(
      (row) => row.state === INTERVIEW_STATE.COMPLETE_INTERVIEW
    );

    // Filter based on status and whether email was already sent
    const membersToEmail = completedMembers.filter((member) => {
      // Skip if already sent
      if (member.isApprovedEmailSend === true) {
        return false;
      }

      // Skip if pending
      if (member.approved === APPROVAL_STATUS.PENDING) {
        return false;
      }

      // Filter by status parameter
      if (status === 'approved') {
        return member.approved === APPROVAL_STATUS.APPROVED;
      } else if (status === 'rejected') {
        return member.approved === APPROVAL_STATUS.REJECTED;
      } else if (status === 'all') {
        return (
          member.approved === APPROVAL_STATUS.APPROVED ||
          member.approved === APPROVAL_STATUS.REJECTED
        );
      }

      return false;
    });

    if (membersToEmail.length === 0) {
      return NextResponse.json(
        {
          message: 'No members found to send emails',
          results: [],
        },
        { status: 200 }
      );
    }

    // Send emails one by one (sequential, not batched)
    const EMAIL_BATCH_DELAY_MS = getEmailBatchDelay();
    console.log(`📧 Starting approval email send: ${membersToEmail.length} total emails`);
    console.log(
      `⚙️  Sending one email at a time with ${EMAIL_BATCH_DELAY_MS / 1000}s delay between each`
    );

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Create transporter for sequential sending
    const transporterConfig = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(transporterConfig);

    try {
      // Send emails one by one
      for (let i = 0; i < membersToEmail.length; i++) {
        const member = membersToEmail[i];
        const currentNumber = i + 1;

        console.log(
          `\n� Email ${currentNumber}/${membersToEmail.length}: Sending to ${member.emailAddress}...`
        );

        try {
          const isApproved = member.approved === APPROVAL_STATUS.APPROVED;
          const template = isApproved ? approvedTemplate : rejectedTemplate;

          const firstName = member.fullName.split(' ')[0] || member.fullName;
          const committee = member.trackApplying || 'N/A';

          // Get committee link (only for approved members)
          let committeeLink = '';
          if (isApproved) {
            const committeeLower = committee.toLowerCase().trim();
            committeeLink = whatsAppGroups.get(committeeLower) || '';
          }

          // Fill template
          const emailContent = fillTemplate(template, {
            firstName: firstName,
            committee: committee,
            committeeLink: committeeLink,
          });

          const subject = isApproved
            ? `Congratulations! Welcome to IEEE KSB ${committee} Committee`
            : `IEEE KSB Application Update`;

          // Send email
          await transporter.sendMail({
            from: EMAIL_FROM,
            to: member.emailAddress,
            // cc: 'ahmedfahmy@ieee.org',
            subject,
            html: emailContent,
          });

          console.log(`   ✅ Success: ${member.fullName} (${committee})`);

          results.push({
            success: true,
            name: member.fullName,
            email: member.emailAddress,
            committee: committee,
            status: member.approved,
            memberId: member.id,
          });

          successCount++;
        } catch (error) {
          console.error(
            `   ❌ Failed: ${member.emailAddress} -`,
            error instanceof Error ? error.message : 'Unknown error'
          );

          results.push({
            success: false,
            name: member.fullName,
            email: member.emailAddress,
            committee: member.trackApplying,
            status: member.approved,
            memberId: member.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          failCount++;
        }

        // Wait before next email (except for the last one)
        if (i + 1 < membersToEmail.length) {
          console.log(`   ⏳ Waiting ${EMAIL_BATCH_DELAY_MS / 1000}s before next email...`);
          await new Promise((resolve) => setTimeout(resolve, EMAIL_BATCH_DELAY_MS));
        }
      }
    } finally {
      // Close transporter connection
      transporter.close();
      console.log('\n🔌 Connection closed');
    }

    console.log(`\n✨ Email sending complete!`);
    console.log(`   📊 Total: ${membersToEmail.length} emails`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    // Batch update isApprovedEmailSend for successful sends
    // This uses only 2 API calls total (1 read, 1 batch write) instead of hundreds
    const successfulUpdates = results
      .filter((r) => r.success && r.memberId) // Ensure memberId exists
      .map((r) => ({
        id: r.memberId!,
        updates: { isApprovedEmailSend: true },
      }));

    if (successfulUpdates.length > 0) {
      console.log(`\n📝 Batch updating ${successfulUpdates.length} members...`);
      await batchUpdateMembers(successfulUpdates, 'system', season);
      console.log(`   ✅ Batch update complete`);
    }

    const message = `Sent ${successCount} email(s) successfully. ${failCount} failed.`;

    return NextResponse.json(
      {
        message,
        results,
        summary: {
          total: membersToEmail.length,
          success: successCount,
          failed: failCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send-approved endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to send emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
