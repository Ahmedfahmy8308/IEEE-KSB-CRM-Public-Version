// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Member Operations Module
 * Handles CRUD operations for applicant members
 */

import type { ApplicantRow } from './sheets';
import { readAllRows, findRowById, updateRow, batchUpdateRows } from './sheets';
import { INTERVIEW_STATE } from './constants';

/**
 * Get member by ID
 * @param id Applicant ID
 * @returns Member object or null if not found
 */
export async function getMemberById(id: string, season?: string): Promise<ApplicantRow | null> {
  return await findRowById(id, season);
}

/**
 * Search members by query (fuzzy search on ID, phone, email, name)
 * @param query Search query string
 * @returns Array of matching members
 */
export async function searchMembers(query: string, season?: string): Promise<ApplicantRow[]> {
  const allMembers = await readAllRows(season);

  if (!query || query.trim() === '') {
    return allMembers;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return allMembers.filter((member) => {
    // Search in ID (case-insensitive)
    if (member.id && member.id.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in phone (normalize both - remove non-digits)
    if (member.phoneNumber) {
      const normalizedPhone = member.phoneNumber.replace(/\D/g, '');
      const queryPhone = normalizedQuery.replace(/\D/g, '');
      if (queryPhone && normalizedPhone.includes(queryPhone)) {
        return true;
      }
    }

    // Search in email (case-insensitive)
    if (member.email && member.email.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Search in full name (case-insensitive)
    if (member.fullName && member.fullName.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    return false;
  });
}

/**
 * Update member data and log the changes
 * @param id Member ID
 * @param updates Partial member data to update
 * @param actor Username of person making the change
 * @returns Updated member object
 */
export async function updateMember(
  id: string,
  updates: Partial<ApplicantRow>,
  actor: string,
  season?: string
): Promise<ApplicantRow | null> {
  const member = await findRowById(id, season);

  if (!member || !member.rowIndex) {
    return null;
  }

  // Build log entry
  const timestamp = new Date().toISOString();
  const changes: string[] = [];

  // Track what changed
  for (const [key, newValue] of Object.entries(updates)) {
    if (key === 'rowIndex' || key === 'log') continue;

    const oldValue = member[key as keyof ApplicantRow];
    if (oldValue !== newValue) {
      changes.push(`${key} from "${oldValue}" to "${newValue}"`);
    }
  }

  // Create log entry
  let logEntry = '';
  if (changes.length > 0) {
    logEntry = `${timestamp} | ${actor} | updated: ${changes.join('; ')}`;
  }

  // Append to existing log
  const existingLog = member.log || '';
  const newLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

  // Merge updates
  const updatedMember: ApplicantRow = {
    ...member,
    ...updates,
    log: newLog,
  };

  // Save to sheet
  await updateRow(member.rowIndex, updatedMember, season);

  return updatedMember;
}

/**
 * Batch update multiple members - Optimized to avoid quota limits
 * Only reads the sheet ONCE, then does a batch update
 *
 * @param memberUpdates Array of { id, updates } to apply
 * @param actor Username of person making the changes
 * @returns Array of updated members (null for members not found)
 *
 * @example
 * ```typescript
 * // Update isEmailSend for 500 members in one go
 * const updates = emailResults
 *   .filter(r => r.success)
 *   .map(r => ({ id: r.id, updates: { isEmailSend: true } }));
 *
 * await batchUpdateMembers(updates, 'system');
 * ```
 */
export async function batchUpdateMembers(
  memberUpdates: Array<{ id: string; updates: Partial<ApplicantRow> }>,
  actor: string,
  season?: string
): Promise<Array<ApplicantRow | null>> {
  // Read all members ONCE (single API call)
  const allMembers = await readAllRows(season);

  // Create a map for quick lookup
  const memberMap = new Map<string, ApplicantRow>();
  for (const member of allMembers) {
    if (member.id) {
      memberMap.set(member.id, member);
    }
  }

  const timestamp = new Date().toISOString();
  const batchUpdates: Array<{ rowIndex: number; data: ApplicantRow }> = [];
  const results: Array<ApplicantRow | null> = [];

  // Process each update
  for (const { id, updates } of memberUpdates) {
    const member = memberMap.get(id);

    if (!member || !member.rowIndex) {
      results.push(null);
      continue;
    }

    // Build log entry
    const changes: string[] = [];
    for (const [key, newValue] of Object.entries(updates)) {
      if (key === 'rowIndex' || key === 'log') continue;

      const oldValue = member[key as keyof ApplicantRow];
      if (oldValue !== newValue) {
        changes.push(`${key} from "${oldValue}" to "${newValue}"`);
      }
    }

    // Create log entry
    let logEntry = '';
    if (changes.length > 0) {
      logEntry = `${timestamp} | ${actor} | updated: ${changes.join('; ')}`;
    }

    // Append to existing log
    const existingLog = member.log || '';
    const newLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

    // Merge updates
    const updatedMember: ApplicantRow = {
      ...member,
      ...updates,
      log: newLog,
    };

    batchUpdates.push({
      rowIndex: member.rowIndex,
      data: updatedMember,
    });

    results.push(updatedMember);
  }

  // Execute batch update (single API call)
  if (batchUpdates.length > 0) {
    await batchUpdateRows(batchUpdates, season);
  }

  return results;
}

/**
 * Get statistics about members
 * @returns Stats object
 */
/**
 * Calculate statistics for an array of members
 * @param members Array of members to calculate stats for
 * @returns Statistics object
 */
export function calculateMemberStats(members: ApplicantRow[]): {
  total: number;
  assigned: number;
  emailSent: number;
  approvedEmailSent: number;
  approved: number;
  completed: number;
  inProgress: number;
  pending: number;
  byCommittee: Record<string, number>;
  idMatched: number;
  idNew: number;
  idMismatch: number;
  idNeedReview: number;
  physical: number;
  online: number;
} {
  const stats = {
    total: members.length,
    assigned: 0,
    emailSent: 0,
    approvedEmailSent: 0,
    approved: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    byCommittee: {} as Record<string, number>,
    idMatched: 0,
    idNew: 0,
    idMismatch: 0,
    idNeedReview: 0,
    physical: 0,
    online: 0,
  };

  for (const member of members) {
    // Count assigned (has interview day/time)
    if (member.interviewDay && member.interviewTime) {
      stats.assigned++;
    }

    // Count emails sent
    if (member.isEmailSend) {
      stats.emailSent++;
    }

    // Count approved emails sent
    if (member.isApprovedEmailSend) {
      stats.approvedEmailSent++;
    }

    // Count approved
    if (
      member.approved === 'TRUE' ||
      member.approved === 'true' ||
      member.approved === 'Yes' ||
      member.approved === 'approved'
    ) {
      stats.approved++;
    }

    // Count completed interviews
    if (member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW) {
      stats.completed++;
    }

    // Count in progress interviews
    if (member.state === INTERVIEW_STATE.IN_INTERVIEW) {
      stats.inProgress++;
    }

    // Count pending interviews (Not Started state)
    if (!member.state || member.state === INTERVIEW_STATE.NOT_STARTED) {
      stats.pending++;
    }

    // Count by committee
    if (member.trackApplying) {
      // Split by comma and count each committee separately
      const committees = member.trackApplying.split(',').map((c) => c.trim());
      committees.forEach((committee) => {
        if (committee) {
          // Skip empty strings
          stats.byCommittee[committee] = (stats.byCommittee[committee] || 0) + 1;
        }
      });
    }

    // S2 ID validation counts
    const vs = (member.idValidationStatus || '').trim();
    if (vs === 'Matched') stats.idMatched++;
    else if (vs === 'Wrong ID') stats.idMismatch++;
    else if (vs === 'Need Review') stats.idNeedReview++;
    else if (!vs) stats.idNew++;

    // Interview mode counts (S2)
    const mode = (member.interviewMode || '').trim();
    if (mode === 'Online') stats.online++;
    else if (mode === 'Physical') stats.physical++;
  }

  return stats;
}

/**
 * Get overall member statistics
 * @returns Statistics for all members
 */
export async function getMemberStats(season?: string): Promise<{
  total: number;
  assigned: number;
  emailSent: number;
  approvedEmailSent: number;
  approved: number;
  rejected: number;
  pending: number;
  completed: number;
  notStarted: number;
  notAttended: number;
  byCommittee: Record<string, number>;
  byDay: Record<string, { total: number; physical: number; online: number }>;
  idMatched: number;
  idNew: number;
  idMismatch: number;
  idNeedReview: number;
  physical: number;
  online: number;
}> {
  const members = await readAllRows(season);
  const fullStats = calculateMemberStats(members);

  // Count rejected, not started, and not attended
  let rejected = 0;
  let notStarted = 0;
  let notAttended = 0;

  for (const member of members) {
    // Count rejected
    if (member.approved === 'rejected' || member.approved === 'Rejected') {
      rejected++;
    }

    // Count not started interviews
    if (!member.state || member.state === INTERVIEW_STATE.NOT_STARTED) {
      notStarted++;
    }

    // Count not attended interviews
    if (member.state === INTERVIEW_STATE.NOT_ATTENDED) {
      notAttended++;
    }
  }

  // Count per-day interviews with online/physical breakdown
  const byDay: Record<string, { total: number; physical: number; online: number }> = {};
  for (const member of members) {
    if (member.interviewDay && member.interviewDay.trim()) {
      const day = member.interviewDay.trim();
      if (!byDay[day]) {
        byDay[day] = { total: 0, physical: 0, online: 0 };
      }
      byDay[day].total++;
      const mode = (member.interviewMode || '').trim();
      if (mode === 'Online') {
        byDay[day].online++;
      } else {
        byDay[day].physical++;
      }
    }
  }

  // Return all stats for overall view
  return {
    total: fullStats.total,
    assigned: fullStats.assigned,
    emailSent: fullStats.emailSent,
    approvedEmailSent: fullStats.approvedEmailSent,
    approved: fullStats.approved,
    rejected: rejected,
    pending: members.filter((m) => m.approved === 'pending' || !m.approved || m.approved === '')
      .length,
    completed: fullStats.completed,
    notStarted: notStarted,
    notAttended: notAttended,
    byCommittee: fullStats.byCommittee,
    byDay,
    idMatched: fullStats.idMatched,
    idNew: fullStats.idNew,
    idMismatch: fullStats.idMismatch,
    idNeedReview: fullStats.idNeedReview,
    physical: fullStats.physical,
    online: fullStats.online,
  };
}

/**
 * Get members without interview assignments
 * @returns Array of unassigned members
 */
export async function getUnassignedMembers(season?: string): Promise<ApplicantRow[]> {
  const members = await readAllRows(season);
  return members.filter((m) => !m.interviewDay || !m.interviewTime);
}

/**
 * Get members who haven't received emails yet
 * @returns Array of members without emails sent
 */
export async function getMembersWithoutEmails(season?: string): Promise<ApplicantRow[]> {
  const members = await readAllRows(season);
  return members.filter((m) => !m.isEmailSend);
}

/**
 * Get members without IDs (unscheduled)
 * @returns Array of members without IDs
 */
export async function getMembersWithoutIds(season?: string): Promise<ApplicantRow[]> {
  const members = await readAllRows(season);
  return members.filter((m) => !m.id || m.id.trim() === '');
}

/**
 * Update member data by row index and log the changes
 * Used for members that don't have IDs yet
 * @param rowIndex Row index in the sheet
 * @param updates Partial member data to update
 * @param actor Username of person making the change
 * @returns Updated member object
 */
export async function updateMemberByRowIndex(
  rowIndex: number,
  updates: Partial<ApplicantRow>,
  actor: string,
  season?: string
): Promise<ApplicantRow | null> {
  const members = await readAllRows(season);
  const member = members.find((m) => m.rowIndex === rowIndex);

  if (!member || !member.rowIndex) {
    return null;
  }

  // Build log entry
  const timestamp = new Date().toISOString();
  const changes: string[] = [];

  // Track what changed
  for (const [key, newValue] of Object.entries(updates)) {
    if (key === 'rowIndex' || key === 'log') continue;

    const oldValue = member[key as keyof ApplicantRow];
    if (oldValue !== newValue) {
      changes.push(`${key} from "${oldValue}" to "${newValue}"`);
    }
  }

  // Create log entry
  let logEntry = '';
  if (changes.length > 0) {
    logEntry = `${timestamp} | ${actor} | updated: ${changes.join('; ')}`;
  }

  // Append to existing log
  const existingLog = member.log || '';
  const newLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

  // Merge updates
  const updatedMember: ApplicantRow = {
    ...member,
    ...updates,
    log: newLog,
  };

  // Save to sheet
  await updateRow(member.rowIndex, updatedMember, season);

  return updatedMember;
}

/**
 * Batch update multiple members by row index
 * Uses batch API to avoid rate limiting
 */
export async function batchUpdateMembersByRowIndex(
  updates: Array<{ rowIndex: number; updates: Partial<ApplicantRow>; actor: string }>,
  season?: string
): Promise<number> {
  if (updates.length === 0) return 0;

  const members = await readAllRows(season);
  const timestamp = new Date().toISOString();

  const batchUpdates: Array<{ rowIndex: number; data: ApplicantRow }> = [];

  for (const { rowIndex, updates: memberUpdates, actor } of updates) {
    const member = members.find((m) => m.rowIndex === rowIndex);

    if (!member || !member.rowIndex) {
      console.error(`Member at row ${rowIndex} not found`);
      continue;
    }

    const changes: string[] = [];
    for (const [key, newValue] of Object.entries(memberUpdates)) {
      if (key === 'rowIndex' || key === 'log') continue;

      const oldValue = member[key as keyof ApplicantRow];
      if (oldValue !== newValue) {
        changes.push(`${key} from "${oldValue}" to "${newValue}"`);
      }
    }

    let logEntry = '';
    if (changes.length > 0) {
      logEntry = `${timestamp} | ${actor} | updated: ${changes.join('; ')}`;
    }

    const existingLog = member.log || '';
    const newLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

    const updatedMember: ApplicantRow = {
      ...member,
      ...memberUpdates,
      log: newLog,
    };

    batchUpdates.push({
      rowIndex: member.rowIndex,
      data: updatedMember,
    });
  }

  if (batchUpdates.length > 0) {
    await batchUpdateRows(batchUpdates, season);
  }

  return batchUpdates.length;
}
