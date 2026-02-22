// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Single Member API Route
 * GET /api/interviews/members/[id]
 * PATCH /api/interviews/members/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getMemberById, updateMember } from '@/lib/members';
import { canAccessMember, getAllowedEditFields } from '@/lib/auth';
import { normalizeApproved, normalizeState, APPROVED_VALUES, STATE_VALUES } from '@/lib/sheets';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const member = await getMemberById(id, season);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check access
    if (!canAccessMember(user, member.trackApplying || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const member = await getMemberById(id, season);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // if (user.role !== 'ChairMan') {
    //   // Only ChairMan can edit now
    //   return NextResponse.json(
    //     { error: 'Forbidden: Only ChairMan can edit members' },
    //     { status: 403 }
    //   );
    // }

    // Check if user can edit
    // if (!canEdit(user)) {
    //   return NextResponse.json(
    //     { error: 'Forbidden: You do not have edit permissions' },
    //     { status: 403 }
    //   );
    // }

    // Check access - user must be able to view the member
    if (!canAccessMember(user, member.trackApplying || '')) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot access this member' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json({ error: 'Updates are required' }, { status: 400 });
    }

    // Validate updates object
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an object' }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Updates cannot be empty' }, { status: 400 });
    }

    // Validate specific fields if provided
    if (updates.email && typeof updates.email === 'string') {
      // Trim whitespace before validation
      updates.email = updates.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      console.log(
        'Validating email:',
        JSON.stringify(updates.email),
        'Test result:',
        emailRegex.test(updates.email)
      );
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json(
          { error: `Invalid email format. Received: "${updates.email}"` },
          { status: 400 }
        );
      }
    }

    // Validate emailAddress if provided
    if (updates.emailAddress && typeof updates.emailAddress === 'string') {
      // Trim whitespace before validation
      updates.emailAddress = updates.emailAddress.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      console.log(
        'Validating emailAddress:',
        JSON.stringify(updates.emailAddress),
        'Test result:',
        emailRegex.test(updates.emailAddress)
      );
      if (!emailRegex.test(updates.emailAddress)) {
        return NextResponse.json(
          { error: `Invalid form email format. Received: "${updates.emailAddress}"` },
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

    if (updates.approved !== undefined) {
      const normalized = normalizeApproved(String(updates.approved));

      if (!normalized) {
        return NextResponse.json(
          { error: `Approved must be one of: ${Object.values(APPROVED_VALUES).join(', ')}` },
          { status: 400 }
        );
      }

      updates.approved = normalized;
    }

    if (updates.state !== undefined) {
      const stateValue = String(updates.state);
      console.log(
        'Received state value:',
        JSON.stringify(stateValue),
        'Type:',
        typeof updates.state
      );
      const normalized = normalizeState(stateValue);
      console.log('Normalized state value:', JSON.stringify(normalized));

      if (normalized === null) {
        return NextResponse.json(
          {
            error: `State must be one of: (empty/Not Started), ${Object.values(STATE_VALUES).join(', ')}. Received: "${stateValue}"`,
          },
          { status: 400 }
        );
      }

      updates.state = normalized;
    }

    if (updates.isEmailSend !== undefined && typeof updates.isEmailSend !== 'boolean') {
      return NextResponse.json({ error: 'isEmailSend must be a boolean' }, { status: 400 });
    }

    if (updates.interviewMode !== undefined && season === 'S2') {
      const mode = String(updates.interviewMode);
      if (mode !== 'Physical' && mode !== 'Online') {
        return NextResponse.json(
          { error: 'interviewMode must be either "Physical" or "Online"' },
          { status: 400 }
        );
      }
      updates.interviewMode = mode;
    } else if (season !== 'S2') {
      delete updates.interviewMode;
    }

    // Filter updates based on user role using helper function
    const allowedFields = getAllowedEditFields(user);

    let allowedUpdates: Record<string, string | number | boolean> = {};

    if (allowedFields === 'all') {
      // ChairMan can update all fields
      allowedUpdates = updates;
    } else if (allowedFields.length > 0) {
      allowedUpdates = Object.keys(updates)
        .filter((key) => allowedFields.includes(key))
        .reduce(
          (obj, key) => {
            obj[key] = updates[key];
            return obj;
          },
          {} as Record<string, string | number | boolean>
        );

      if (Object.keys(allowedUpdates).length === 0) {
        const fieldsList = allowedFields.join(', ');
        return NextResponse.json(
          { error: `Forbidden: You can only update these fields: ${fieldsList}` },
          { status: 403 }
        );
      }
    } else {
      // No edit permissions
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to edit any fields' },
        { status: 403 }
      );
    }

    // Update member with allowed updates
    const updatedMember = await updateMember(id, allowedUpdates, user.username, season);

    if (!updatedMember) {
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }

    return NextResponse.json({
      member: updatedMember,
      message:
        user.role === 'ChairMan'
          ? 'Member updated successfully'
          : 'Updated allowed fields (state, note, approved)',
    });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
});
