// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Single Attendee API Route
 * GET /api/welcome-day/attendees/[id] - Get attendee by row index or ticket ID (QR code)
 * PATCH /api/welcome-day/attendees/[id] - Update attendee (ChairMan only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { readAllWelcomeDayAttendees, updateWelcomeDayAttendee } from '@/lib/sheets/welcomeDay';
import type { User } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Attendee ID or ticket ID is required' }, { status: 400 });
    }

    const attendees = await readAllWelcomeDayAttendees(season);
    let attendee;

    // Try to find by row index first
    const rowIndex = parseInt(id, 10);
    if (!isNaN(rowIndex)) {
      attendee = attendees.find((a) => a.rowIndex === rowIndex);
    }

    // If not found by row index, try to find by ticket ID (QR code)
    if (!attendee) {
      attendee = attendees.find((a) => a.qrCode?.toLowerCase() === id.toLowerCase());
    }

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    // Check access based on role
    // Board members can only view attendees from their committee
    if (user.role === 'board' && user.committee) {
      if (attendee.committee?.toLowerCase() !== user.committee?.toLowerCase()) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your committee attendees' },
          { status: 403 }
        );
      }
    }

    // Determine if user can view sensitive data (only ChairMan can)
    const canViewSensitive = user.role === 'ChairMan';

    // Filter sensitive fields based on role
    // ChairMan can view everything
    // Highboard and board cannot view nationalId and paymentScreenshot
    let responseData;

    if (canViewSensitive) {
      // ChairMan can see everything
      responseData = attendee;
    } else {
      // Board and highboard cannot see nationalId and paymentScreenshot

      const {
        paymentScreenshot: _paymentScreenshot,
        nationalId: _nationalId,
        ...safeData
      } = attendee;
      responseData = safeData;
    }

    return NextResponse.json({
      attendee: responseData,
      canViewSensitiveData: canViewSensitive,
    });
  } catch (error) {
    console.error('Get attendee error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendee' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, user: User) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Attendee ID is required' }, { status: 400 });
    }

    const attendees = await readAllWelcomeDayAttendees(season);
    let attendee;

    // Try to find by row index first
    const rowIndex = parseInt(id, 10);
    if (!isNaN(rowIndex)) {
      attendee = attendees.find((a) => a.rowIndex === rowIndex);
    }

    // If not found by row index, try to find by ticket ID (QR code)
    if (!attendee) {
      attendee = attendees.find((a) => a.qrCode?.toLowerCase() === id.toLowerCase());
    }

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    // Check access based on role
    // Board members can only edit attendees from their committee
    if (user.role === 'board' && user.committee) {
      if (attendee.committee?.toLowerCase() !== user.committee?.toLowerCase()) {
        return NextResponse.json(
          { error: 'Forbidden: You can only edit your committee attendees' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates are required' }, { status: 400 });
    }

    // Prevent editing of protected fields (nationalId, paymentScreenshot, qrCode)
    const protectedFields = ['nationalId', 'paymentScreenshot', 'qrCode'];
    const attemptedProtectedFields = protectedFields.filter((field) => field in updates);

    if (attemptedProtectedFields.length > 0) {
      return NextResponse.json(
        { error: `Cannot edit protected fields: ${attemptedProtectedFields.join(', ')}` },
        { status: 403 }
      );
    }

    // Define which fields each role can edit
    const allowedFieldsByRole: Record<string, string[]> = {
      ChairMan: [
        'fullName',
        'email',
        'emailAddress',
        'phoneNumber',
        'isIEEEMember',
        'committee',
        'paymentMethod',
        'referenceNumber',
        'checked',
        'attended',
        'note',
        'isEmailSend',
      ],
      highboard: ['checked', 'attended', 'note'],
      board: ['checked', 'attended', 'note'],
    };

    const allowedFields = allowedFieldsByRole[user.role] || [];

    // Check if user is trying to edit fields they're not allowed to
    const unauthorizedFields = Object.keys(updates).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unauthorizedFields.length > 0) {
      return NextResponse.json(
        { error: `You are not authorized to edit these fields: ${unauthorizedFields.join(', ')}` },
        { status: 403 }
      );
    }

    // Validate specific fields if provided
    if (updates.emailAddress && typeof updates.emailAddress === 'string') {
      updates.emailAddress = updates.emailAddress.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.emailAddress)) {
        return NextResponse.json(
          { error: `Invalid email format. Received: "${updates.emailAddress}"` },
          { status: 400 }
        );
      }
    }

    if (updates.phoneNumber && typeof updates.phoneNumber === 'string') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(updates.phoneNumber)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    if (updates.attended !== undefined && typeof updates.attended !== 'string') {
      return NextResponse.json(
        { error: 'Attended must be a string ("true" or "false")' },
        { status: 400 }
      );
    }

    // Update the attendee with timestamp log
    const timestamp = new Date().toISOString();
    const changes: string[] = [];

    // Track what changed
    for (const [key, newValue] of Object.entries(updates)) {
      if (key === 'rowIndex' || key === 'log') continue;

      const oldValue = attendee[key as keyof typeof attendee];
      if (oldValue !== newValue) {
        changes.push(`${key} from "${oldValue}" to "${newValue}"`);
      }
    }

    // Create log entry in format: timestamp | username | action
    let logEntry = '';
    if (changes.length > 0) {
      logEntry = `${timestamp} | ${user.username} | updated: ${changes.join('; ')}`;
    }

    // Append to existing log
    const existingLog = attendee.log || '';
    const newLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

    const updatedAttendee = {
      ...attendee,
      ...updates,
      log: newLog,
    };

    // Use the actual row index for update
    const actualRowIndex = attendee.rowIndex || rowIndex;
    await updateWelcomeDayAttendee(actualRowIndex, updatedAttendee, season);

    return NextResponse.json({
      attendee: updatedAttendee,
      message: 'Attendee updated successfully',
    });
  } catch (error) {
    console.error('Update attendee error:', error);
    return NextResponse.json({ error: 'Failed to update attendee' }, { status: 500 });
  }
});
