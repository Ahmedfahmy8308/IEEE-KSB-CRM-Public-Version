// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Assign Schedule API Route
 * POST /api/interviews/schedule/assign
 * Assigns interview schedule (Day, Time) to members with empty interview fields
 * Also sets State = "" (Not Started) and IS EmailSend = false
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import {
  generateSchedule,
  assignApplicantsToSchedule,
  scheduleToAssignments,
} from '@/lib/schedule';
import { batchUpdateMembersByRowIndex } from '@/lib/members';
import { readAllRows, ApplicantRow } from '@/lib/sheets';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';

export const POST = withRole('ChairMan', async (request: NextRequest, user) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;
    const body = await request.json();
    const { startDate, endDate, startTime, endTime, intervalMinutes, parallelSeats } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Get all members and filter those with empty interview fields
    const allMembers = await readAllRows(season);
    const membersNeedingSchedule = allMembers.filter(
      (m) =>
        !m.interviewDay ||
        m.interviewDay.trim() === '' ||
        !m.interviewTime ||
        m.interviewTime.trim() === ''
    );

    if (membersNeedingSchedule.length === 0) {
      return NextResponse.json({
        message: 'No members need scheduling',
        assigned: 0,
      });
    }

    // Generate schedule
    const schedule = generateSchedule(
      startDate,
      endDate,
      startTime,
      endTime,
      intervalMinutes,
      parallelSeats
    );

    // Check if we have enough slots
    if (schedule.totalSlots < membersNeedingSchedule.length) {
      return NextResponse.json(
        {
          error: `Not enough interview slots. Need ${membersNeedingSchedule.length} slots but only ${schedule.totalSlots} available.`,
          required: membersNeedingSchedule.length,
          available: schedule.totalSlots,
        },
        { status: 400 }
      );
    }

    // Get member IDs for assignment
    const memberIds = membersNeedingSchedule.map((m) => m.id || '');

    // Assign applicants to schedule
    const assignedSchedule = assignApplicantsToSchedule(schedule, memberIds);

    // Convert to assignments
    const assignments = scheduleToAssignments(assignedSchedule);

    // Prepare batch updates
    const batchUpdates: Array<{ rowIndex: number; updates: Partial<ApplicantRow>; actor: string }> =
      [];

    for (let i = 0; i < membersNeedingSchedule.length; i++) {
      const member = membersNeedingSchedule[i];
      const assignment = assignments[i];

      if (!member.rowIndex) {
        console.error(`Member ${member.fullName} has no rowIndex`);
        continue;
      }

      // Prepare update data with all required fields
      const updates: Partial<ApplicantRow> = {
        interviewDay: assignment.interviewDay,
        interviewTime: assignment.interviewTime,
        state: INTERVIEW_STATE.NOT_STARTED, // Not Started state (empty string)
        isEmailSend: false,
      };

      // Only set approved to Pending if it's not already set
      if (!member.approved || member.approved.trim() === '') {
        updates.approved = APPROVAL_STATUS.PENDING;
      }

      batchUpdates.push({
        rowIndex: member.rowIndex,
        updates,
        actor: user.username,
      });
    }

    // Perform batch update
    const successCount = await batchUpdateMembersByRowIndex(batchUpdates, season);

    return NextResponse.json({
      message: `Successfully assigned ${successCount} members`,
      assigned: successCount,
      schedule: assignedSchedule,
    });
  } catch (error) {
    console.error('Assign schedule error:', error);
    return NextResponse.json({ error: 'Failed to assign schedule' }, { status: 500 });
  }
});
