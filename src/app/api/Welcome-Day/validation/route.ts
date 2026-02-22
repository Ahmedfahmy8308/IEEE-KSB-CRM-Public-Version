// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Validation API Route
 * GET /api/welcome-day/validation - Get all validation issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readAllWelcomeDayAttendees } from '@/lib/sheets/welcomeDay';

export const GET = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    // Find duplicate phone numbers - group by phone
    const phoneMap = new Map<string, typeof attendees>();
    attendees.forEach((attendee) => {
      const phone = attendee.phoneNumber?.trim();
      if (phone) {
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, []);
        }
        phoneMap.get(phone)!.push(attendee);
      }
    });

    const duplicatePhones = Array.from(phoneMap.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([phone, group]) => ({
        phone,
        attendees: group.map((a) => ({
          id: String(a.rowIndex || ''),
          fullName: a.fullName,
          email: a.email,
        })),
      }));

    // Find duplicate contact emails (email field) - group by email
    const emailMap = new Map<string, typeof attendees>();
    attendees.forEach((attendee) => {
      const email = attendee.email?.toLowerCase().trim();
      if (email) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(attendee);
      }
    });

    const duplicateEmails = Array.from(emailMap.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([email, group]) => ({
        email,
        attendees: group.map((a) => ({
          id: String(a.rowIndex || ''),
          fullName: a.fullName,
          email: a.email,
        })),
      }));

    // Find duplicate form email addresses (emailAddress field) - group by emailAddress
    const emailAddressMap = new Map<string, typeof attendees>();
    attendees.forEach((attendee) => {
      const emailAddress = attendee.emailAddress?.toLowerCase().trim();
      if (emailAddress) {
        if (!emailAddressMap.has(emailAddress)) {
          emailAddressMap.set(emailAddress, []);
        }
        emailAddressMap.get(emailAddress)!.push(attendee);
      }
    });

    const duplicateEmailAddresses = Array.from(emailAddressMap.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([emailAddress, group]) => ({
        emailAddress,
        attendees: group.map((a) => ({
          id: String(a.rowIndex || ''),
          fullName: a.fullName,
          email: a.email,
        })),
      }));

    // Find email mismatches (emailAddress vs email)
    const emailMismatches = attendees
      .filter((attendee) => {
        const email1 = attendee.emailAddress?.toLowerCase().trim();
        const email2 = attendee.email?.toLowerCase().trim();
        return email1 && email2 && email1 !== email2;
      })
      .map((attendee) => ({
        id: String(attendee.rowIndex || ''),
        fullName: attendee.fullName,
        email: attendee.email,
        emailAddress: attendee.emailAddress,
      }));

    const totalIssues =
      duplicatePhones.length +
      duplicateEmails.length +
      duplicateEmailAddresses.length +
      emailMismatches.length;

    return NextResponse.json({
      validations: {
        duplicatePhones,
        duplicateEmails,
        duplicateEmailAddresses,
        emailMismatches,
      },
      summary: {
        duplicatePhones: duplicatePhones.length,
        duplicateEmails: duplicateEmails.length,
        duplicateEmailAddresses: duplicateEmailAddresses.length,
        emailMismatches: emailMismatches.length,
        totalIssues,
      },
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Failed to validate attendees' }, { status: 500 });
  }
});
