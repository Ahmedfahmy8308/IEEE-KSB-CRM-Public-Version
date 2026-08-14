// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Send Email to Specific Attendee API Route
 * POST /api/welcome-day/email/send/[id] - Send email to specific attendee by ticket ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees, updateWelcomeDayAttendee } from '@/lib/sheets/welcomeDay';
import {
  appendSheetLogEntry,
  buildSheetUpdateLogEntry,
  collectSheetFieldChanges,
} from '@/lib/sheets/logging';

export const POST = withRoles(['ChairMan'], async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const ticketId = request.nextUrl.pathname.split('/').pop();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const attendees = await readAllWelcomeDayAttendees(season);
    const attendee = attendees.find((a) => a.qrCode === ticketId.trim());

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found with this ticket ID' },
        { status: 404 }
      );
    }

    if (!attendee.rowIndex) {
      return NextResponse.json({ error: 'Invalid attendee data' }, { status: 500 });
    }

    const email = attendee.emailAddress || attendee.email;

    if (!email) {
      return NextResponse.json(
        { error: 'No email address found for this attendee' },
        { status: 400 }
      );
    }

    const { sendWelcomeDayEmail, DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE } = await import('@/lib/email');

    // QR code image will be attached directly to the email
    await sendWelcomeDayEmail(
      email,
      'Welcome Day Confirmation - IEEE KSB',
      DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE,
      {
        fullName: attendee.fullName,
        committee: attendee.committee,
        qrCode: attendee.qrCode,
      }
    );

    // Mark email as sent
    const changes = collectSheetFieldChanges(
      attendee,
      { isEmailSend: true },
      {
        ignoreFields: ['rowIndex', 'log'],
      }
    );
    const logEntry = buildSheetUpdateLogEntry({
      actor: {
        name: user.name || user.username,
        email: user.username,
      },
      changes,
      action: 'email sent',
    });

    const updatedAttendee = {
      ...attendee,
      isEmailSend: true,
      log: appendSheetLogEntry(attendee.log, logEntry),
    };

    await updateWelcomeDayAttendee(attendee.rowIndex, updatedAttendee, season);

    return NextResponse.json({
      message: `Email sent successfully to ${attendee.fullName}`,
      email,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
});
