// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Attendees Helper Functions
 * Centralized functions for attendee operations
 */

import {
  readAllWelcomeDayAttendees,
  updateWelcomeDayAttendee,
  type WelcomeDayAttendee,
} from '@/lib/sheets/welcomeDay';

/**
 * Get attendee by row index
 */
export async function getAttendeeById(
  rowIndex: number,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  const attendees = await readAllWelcomeDayAttendees(season);
  return attendees.find((a) => a.rowIndex === rowIndex) || null;
}

/**
 * Get attendee by ticket ID (QR code)
 */
export async function getAttendeeByTicketId(
  ticketId: string,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  const attendees = await readAllWelcomeDayAttendees(season);
  return attendees.find((a) => a.qrCode?.toLowerCase() === ticketId.toLowerCase()) || null;
}

/**
 * Get attendee by row index or ticket ID
 */
export async function getAttendeeByIdOrTicket(
  id: string,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  // Try row index first
  const rowIndex = parseInt(id, 10);
  if (!isNaN(rowIndex)) {
    const attendee = await getAttendeeById(rowIndex, season);
    if (attendee) return attendee;
  }

  // Try ticket ID
  return await getAttendeeByTicketId(id, season);
}

/**
 * Search attendees by query (name, email, phone, or ticket ID)
 */
export async function searchAttendees(
  query: string,
  season?: string
): Promise<WelcomeDayAttendee[]> {
  const attendees = await readAllWelcomeDayAttendees(season);
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return attendees;
  }

  return attendees.filter((attendee) => {
    const matchesName = attendee.fullName?.toLowerCase().includes(normalizedQuery);
    const matchesEmail =
      attendee.emailAddress?.toLowerCase().includes(normalizedQuery) ||
      attendee.email?.toLowerCase().includes(normalizedQuery);
    const matchesPhone = attendee.phoneNumber?.includes(normalizedQuery);
    const matchesTicket = attendee.qrCode?.toLowerCase().includes(normalizedQuery);

    return matchesName || matchesEmail || matchesPhone || matchesTicket;
  });
}

/**
 * Get attendees by committee
 */
export async function getAttendeesByCommittee(
  committee: string,
  season?: string
): Promise<WelcomeDayAttendee[]> {
  const attendees = await readAllWelcomeDayAttendees(season);
  return attendees.filter((a) => a.committee?.toLowerCase() === committee.toLowerCase());
}

/**
 * Update attendee with validation
 */
export async function updateAttendee(
  rowIndex: number,

  updates: Record<string, string | number | boolean>,
  username: string,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  const attendee = await getAttendeeById(rowIndex, season);

  if (!attendee) {
    return null;
  }

  // Create timestamp log
  const timestamp = new Date().toISOString();
  const updatedFields = Object.keys(updates).join(', ');
  const logEntry = `[${timestamp}] Updated by ${username}: ${updatedFields}`;

  const updatedAttendee = {
    ...attendee,
    ...updates,
    log: `${attendee.log || ''}\n${logEntry}`.trim(),
  };

  await updateWelcomeDayAttendee(rowIndex, updatedAttendee, season);
  return updatedAttendee;
}

/**
 * Calculate attendee statistics
 */
export function calculateAttendeeStats(attendees: WelcomeDayAttendee[]) {
  return {
    total: attendees.length,
    checked: attendees.filter((a) => a.checked?.toLowerCase() === 'passed').length,
    notChecked: attendees.filter((a) => !a.checked || a.checked?.toLowerCase() === 'not checked')
      .length,
    failed: attendees.filter((a) => a.checked?.toLowerCase() === 'failed').length,
    attended: attendees.filter((a) => a.attended?.toLowerCase() === 'true').length,
    notAttended: attendees.filter((a) => !a.attended || a.attended?.toLowerCase() === 'false')
      .length,
    hasQrCode: attendees.filter((a) => a.qrCode && a.qrCode.trim() !== '').length,
    emailSent: attendees.filter((a) => a.isEmailSend === true).length,
    hasNotes: attendees.filter((a) => a.note && a.note.trim() !== '').length,
  };
}

/**
 * Get overall attendee statistics (optimized - single pass)
 * Similar to getMemberStats in interviews
 */
export async function getAttendeeStats(season?: string): Promise<{
  total: number;
  checked: number;
  notChecked: number;
  failed: number;
  attended: number;
  notAttended: number;
  hasQrCode: number;
  emailSent: number;
  hasNotes: number;
  validationPassed: number;
  validationNotChecked: number;
  validationFailed: number;
  paymentInstapay: number;
  paymentVodafoneCash: number;
  qrCodesGenerated: number;
  byCommittee: Record<string, number>;
}> {
  // Read all attendees once
  const attendees = await readAllWelcomeDayAttendees(season);

  // Calculate stats in a single pass
  const stats = calculateAttendeeStats(attendees);

  // Calculate committee breakdown in-memory
  const byCommittee: Record<string, number> = {};
  attendees.forEach((attendee) => {
    if (attendee.committee) {
      byCommittee[attendee.committee] = (byCommittee[attendee.committee] || 0) + 1;
    }
  });

  // Calculate validation status counts
  const validationPassed = attendees.filter((a) => a.checked?.toLowerCase() === 'passed').length;
  const validationNotChecked = attendees.filter(
    (a) => !a.checked || a.checked?.toLowerCase() === 'not checked'
  ).length;
  const validationFailed = attendees.filter((a) => a.checked?.toLowerCase() === 'failed').length;

  // Calculate payment method counts
  const paymentInstapay = attendees.filter(
    (a) => a.paymentMethod?.toLowerCase() === 'instapay'
  ).length;
  const paymentVodafoneCash = attendees.filter(
    (a) => a.paymentMethod?.toLowerCase() === 'vodafone cash'
  ).length;

  // Calculate QR codes generated count
  const qrCodesGenerated = attendees.filter((a) => a.qrCode && a.qrCode.trim() !== '').length;

  return {
    ...stats,
    validationPassed,
    validationNotChecked,
    validationFailed,
    paymentInstapay,
    paymentVodafoneCash,
    qrCodesGenerated,
    byCommittee,
  };
}

/**
 * Get all unique committees
 */
export async function getAllCommittees(season?: string): Promise<string[]> {
  const attendees = await readAllWelcomeDayAttendees(season);
  const committees = new Set(
    attendees.filter((a) => a.committee).map((a) => a.committee as string)
  );
  return Array.from(committees).sort();
}

/**
 * Check if user can access attendee based on committee
 */
export function canAccessAttendee(
  userRole: string,
  userCommittee: string | undefined,
  attendeeCommittee: string
): boolean {
  // ChairMan and highboard can access all attendees
  if (userRole === 'ChairMan' || userRole === 'highboard') {
    return true;
  }

  // Board members can only access their own committee
  if (userRole === 'board') {
    if (!userCommittee || !attendeeCommittee) {
      return false;
    }
    return attendeeCommittee.toLowerCase() === userCommittee.toLowerCase();
  }

  return false;
}

/**
 * Get allowed edit fields based on user role
 */
export function getAllowedEditFieldsForWelcomeDay(userRole: string): string[] | 'all' {
  if (userRole === 'ChairMan') {
    return 'all'; // Can edit all fields
  }

  // For now, only ChairMan can edit Welcome Day data
  // You can extend this later if needed
  return [];
}
