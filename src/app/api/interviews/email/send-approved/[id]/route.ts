// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * API Route: Send Approved/Rejected Email to Specific Member
 * POST /api/interviews/email/send-approved/[id]
 *
 * Sends acceptance or rejection email to a specific member by ID
 * Only sends if member completed their interview and has approved/rejected status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import { findRowById, updateRow } from '@/lib/sheets';
import { sendEmail } from '@/lib/email';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth: ChairMan only
  const authResult = await requireRole(request, 'ChairMan');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const { id: memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Find member by ID
    const member = await findRowById(memberId, season);

    if (!member) {
      return NextResponse.json({ error: `Member with ID ${memberId} not found` }, { status: 404 });
    }

    // Check if member completed interview
    if (member.state !== INTERVIEW_STATE.COMPLETE_INTERVIEW) {
      return NextResponse.json(
        { error: 'Member has not completed their interview yet' },
        { status: 400 }
      );
    }

    // Check if member has approved or rejected status
    if (member.approved === APPROVAL_STATUS.PENDING) {
      return NextResponse.json(
        { error: 'Member status is still pending. Cannot send email.' },
        { status: 400 }
      );
    }

    if (
      member.approved !== APPROVAL_STATUS.APPROVED &&
      member.approved !== APPROVAL_STATUS.REJECTED
    ) {
      return NextResponse.json(
        { error: 'Member must have approved or rejected status' },
        { status: 400 }
      );
    }

    // Note: We allow resending even if already sent when using ID endpoint
    // This gives flexibility to resend emails if needed

    // Load WhatsApp groups
    const whatsAppGroups = loadWhatsAppGroups();

    // Determine which template to use
    const isApproved = member.approved === APPROVAL_STATUS.APPROVED;
    const template = isApproved
      ? loadTemplate('accepted_committee.html')
      : loadTemplate('rejected_committee.html');

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
    await sendEmail(member.email, subject, emailContent);

    // Update the sheet to mark email as sent
    if (member.rowIndex) {
      member.isApprovedEmailSend = true;
      await updateRow(member.rowIndex, member, season);
    }

    const statusText = isApproved ? 'acceptance' : 'rejection';
    return NextResponse.json(
      {
        message: `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} email sent successfully to ${member.fullName}`,
        member: {
          id: member.id,
          name: member.fullName,
          email: member.email,
          committee: committee,
          status: member.approved,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending approved/rejected email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
