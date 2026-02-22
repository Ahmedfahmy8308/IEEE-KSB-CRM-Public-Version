// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * API Route: Send Test Approved/Rejected Emails
 * POST /api/interviews/email/send-approved-test
 *
 * Loads real members from Google Sheets and sends test emails to TEST_EMAIL
 * Sends both approved and rejected emails for all eligible members
 */

import { NextRequest, NextResponse } from 'next/server';
import { readAllRows } from '@/lib/sheets';
import { sendEmail } from '@/lib/email';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';
import { getConfig } from '@/lib/config';
import * as fs from 'fs';
import * as path from 'path';

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
    const TEST_EMAIL = getConfig().email.testEmail || 'test@example.com';
    const results = [];

    // Load WhatsApp groups
    const whatsAppGroups = loadWhatsAppGroups();

    // Load templates
    const approvedTemplate = loadTemplate('accepted_committee.html');
    const rejectedTemplate = loadTemplate('rejected_committee.html');

    // Read all members from Google Sheets
    const members = await readAllRows(season);

    // Filter members who completed their interview and have approved/rejected status
    const approvedMembers = members.filter(
      (member) =>
        member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW &&
        member.approved === APPROVAL_STATUS.APPROVED
    );

    const rejectedMembers = members.filter(
      (member) =>
        member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW &&
        member.approved === APPROVAL_STATUS.REJECTED
    );

    console.log(
      `Found ${approvedMembers.length} approved and ${rejectedMembers.length} rejected members`
    );

    // Group members by committee
    const approvedByCommittee = new Map<string, typeof approvedMembers>();
    const rejectedByCommittee = new Map<string, typeof rejectedMembers>();

    approvedMembers.forEach((member) => {
      const committee = (member.trackApplying || 'N/A').toLowerCase().trim();
      if (!approvedByCommittee.has(committee)) {
        approvedByCommittee.set(committee, []);
      }
      approvedByCommittee.get(committee)!.push(member);
    });

    rejectedMembers.forEach((member) => {
      const committee = (member.trackApplying || 'N/A').toLowerCase().trim();
      if (!rejectedByCommittee.has(committee)) {
        rejectedByCommittee.set(committee, []);
      }
      rejectedByCommittee.get(committee)!.push(member);
    });

    // Get all unique committees
    const allCommittees = new Set([
      ...Array.from(approvedByCommittee.keys()),
      ...Array.from(rejectedByCommittee.keys()),
    ]);

    console.log(`Processing ${allCommittees.size} committees`);

    // Send 2 test emails per committee (1 approved + 1 rejected)
    for (const committee of allCommittees) {
      const committeeName = committee.charAt(0).toUpperCase() + committee.slice(1);

      // Get committee link
      const committeeLink = whatsAppGroups.get(committee) || '';

      // Send approved email (if available)
      const approvedList = approvedByCommittee.get(committee) || [];
      if (approvedList.length > 0) {
        const member = approvedList[0]; // Take first approved member
        const firstName = member.fullName.split(' ')[0] || member.fullName;

        const emailContent = fillTemplate(approvedTemplate, {
          firstName: firstName,
          committee: committeeName,
          committeeLink: committeeLink,
        });

        const subject = `[TEST] Congratulations! Welcome to IEEE KSB ${committeeName} Committee`;

        try {
          await sendEmail(TEST_EMAIL, subject, emailContent);

          results.push({
            success: true,
            memberName: member.fullName,
            memberEmail: member.email,
            testEmail: TEST_EMAIL,
            committee: committeeName,
            status: 'approved',
          });

          console.log(
            `Sent test approved email for ${member.fullName} (${committeeName}) to ${TEST_EMAIL}`
          );
        } catch (error) {
          console.error(`Failed to send approved test email for ${committeeName}:`, error);
          results.push({
            success: false,
            memberName: member.fullName,
            memberEmail: member.email,
            testEmail: TEST_EMAIL,
            committee: committeeName,
            status: 'approved',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send rejected email (if available)
      const rejectedList = rejectedByCommittee.get(committee) || [];
      if (rejectedList.length > 0) {
        const member = rejectedList[0]; // Take first rejected member
        const firstName = member.fullName.split(' ')[0] || member.fullName;

        const emailContent = fillTemplate(rejectedTemplate, {
          firstName: firstName,
          committee: committeeName,
        });

        const subject = '[TEST] IEEE KSB Application Update';

        try {
          await sendEmail(TEST_EMAIL, subject, emailContent);

          results.push({
            success: true,
            memberName: member.fullName,
            memberEmail: member.email,
            testEmail: TEST_EMAIL,
            committee: committeeName,
            status: 'rejected',
          });

          console.log(
            `Sent test rejected email for ${member.fullName} (${committeeName}) to ${TEST_EMAIL}`
          );
        } catch (error) {
          console.error(`Failed to send rejected test email for ${committeeName}:`, error);
          results.push({
            success: false,
            memberName: member.fullName,
            memberEmail: member.email,
            testEmail: TEST_EMAIL,
            committee: committeeName,
            status: 'rejected',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const approvedCount = results.filter((r) => r.status === 'approved').length;
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;

    const message = `Test emails sent for ${allCommittees.size} committees. ${successCount} successful, ${failCount} failed. (${approvedCount} approved, ${rejectedCount} rejected)`;

    return NextResponse.json(
      {
        message,
        results,
        testEmail: TEST_EMAIL,
        committeesCount: allCommittees.size,
        approvedCount,
        rejectedCount,
        successCount,
        failCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending test emails:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
