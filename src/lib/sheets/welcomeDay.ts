// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day Module
 * Handles welcome day attendee data operations
 */

import { readRange, appendToSheet, updateRange, batchUpdate } from './base';
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  COMMITTEES,
  type Committee,
  ValidationStatus,
  VALIDATION_STATUS,
} from '../constants';
import { getWelcomeDaySheetName } from '../season';

// Re-export payment methods and committees for use in components
export { PAYMENT_METHODS, COMMITTEES, VALIDATION_STATUS };
export type { PaymentMethod, Committee, ValidationStatus };

// Column mapping for the welcome day attendee data
export const WELCOME_DAY_COLUMNS = {
  TIMESTAMP: 0,
  EMAIL_ADDRESS: 1,
  FULL_NAME: 2,
  EMAIL: 3,
  PHONE_NUMBER: 4,
  NATIONAL_ID_FILE: 5,
  IS_IEEE_MEMBER: 6,
  COMMITTEE: 7,
  PAYMENT_METHOD: 8,
  PAYMENT_SCREENSHOT: 9,
  REFERENCE_NUMBER: 10,
  CHECKED: 11,
  QR_CODE: 12,
  ATTENDED: 13,
  IS_EMAIL_SEND: 14,
  NOTE: 15,
  LOG: 16,
};

export interface WelcomeDayAttendee {
  timestamp: string;
  emailAddress: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  isIEEEMember: string;
  committee: Committee | string; // Committee type or any string from sheet
  paymentMethod: PaymentMethod | string; // PaymentMethod type or any string from sheet
  paymentScreenshot: string;
  referenceNumber: string;
  checked?: ValidationStatus | string;
  qrCode?: string;
  attended?: string;
  isEmailSend?: boolean;
  note?: string;
  log?: string;
  rowIndex?: number;
}

/**
 * Convert array row to WelcomeDayAttendee object
 */

function rowToAttendee(row: string[], rowIndex: number): WelcomeDayAttendee {
  return {
    timestamp: row[WELCOME_DAY_COLUMNS.TIMESTAMP] || '',
    emailAddress: row[WELCOME_DAY_COLUMNS.EMAIL_ADDRESS] || '',
    fullName: row[WELCOME_DAY_COLUMNS.FULL_NAME] || '',
    email: row[WELCOME_DAY_COLUMNS.EMAIL] || '',
    phoneNumber: row[WELCOME_DAY_COLUMNS.PHONE_NUMBER] || '',
    nationalId: row[WELCOME_DAY_COLUMNS.NATIONAL_ID_FILE] || '',
    isIEEEMember: row[WELCOME_DAY_COLUMNS.IS_IEEE_MEMBER] || '',
    committee: row[WELCOME_DAY_COLUMNS.COMMITTEE] || '',
    paymentMethod: row[WELCOME_DAY_COLUMNS.PAYMENT_METHOD] || '',
    paymentScreenshot: row[WELCOME_DAY_COLUMNS.PAYMENT_SCREENSHOT] || '',
    referenceNumber: row[WELCOME_DAY_COLUMNS.REFERENCE_NUMBER] || '',
    checked: row[WELCOME_DAY_COLUMNS.CHECKED] || '',
    qrCode: row[WELCOME_DAY_COLUMNS.QR_CODE] || '',
    attended: row[WELCOME_DAY_COLUMNS.ATTENDED] || '',
    isEmailSend: row[WELCOME_DAY_COLUMNS.IS_EMAIL_SEND] === 'TRUE',
    note: row[WELCOME_DAY_COLUMNS.NOTE] || '',
    log: row[WELCOME_DAY_COLUMNS.LOG] || '',
    rowIndex,
  };
}

/**
 * Convert WelcomeDayAttendee object to array row
 */

function attendeeToRow(attendee: WelcomeDayAttendee): (string | boolean)[] {
  const row = new Array(17).fill('');

  if (attendee.timestamp) row[WELCOME_DAY_COLUMNS.TIMESTAMP] = attendee.timestamp;
  if (attendee.emailAddress) row[WELCOME_DAY_COLUMNS.EMAIL_ADDRESS] = attendee.emailAddress;
  if (attendee.fullName) row[WELCOME_DAY_COLUMNS.FULL_NAME] = attendee.fullName;
  if (attendee.email) row[WELCOME_DAY_COLUMNS.EMAIL] = attendee.email;
  if (attendee.phoneNumber) row[WELCOME_DAY_COLUMNS.PHONE_NUMBER] = attendee.phoneNumber;
  if (attendee.nationalId) row[WELCOME_DAY_COLUMNS.NATIONAL_ID_FILE] = attendee.nationalId;
  if (attendee.isIEEEMember) row[WELCOME_DAY_COLUMNS.IS_IEEE_MEMBER] = attendee.isIEEEMember;
  if (attendee.committee) row[WELCOME_DAY_COLUMNS.COMMITTEE] = attendee.committee;
  if (attendee.paymentMethod) row[WELCOME_DAY_COLUMNS.PAYMENT_METHOD] = attendee.paymentMethod;
  if (attendee.paymentScreenshot)
    row[WELCOME_DAY_COLUMNS.PAYMENT_SCREENSHOT] = attendee.paymentScreenshot;
  if (attendee.referenceNumber)
    row[WELCOME_DAY_COLUMNS.REFERENCE_NUMBER] = attendee.referenceNumber;
  if (attendee.checked) row[WELCOME_DAY_COLUMNS.CHECKED] = attendee.checked;
  if (attendee.qrCode) row[WELCOME_DAY_COLUMNS.QR_CODE] = attendee.qrCode;
  if (attendee.attended) row[WELCOME_DAY_COLUMNS.ATTENDED] = attendee.attended;
  row[WELCOME_DAY_COLUMNS.IS_EMAIL_SEND] = attendee.isEmailSend ? 'TRUE' : 'FALSE';
  if (attendee.note) row[WELCOME_DAY_COLUMNS.NOTE] = attendee.note;
  if (attendee.log) row[WELCOME_DAY_COLUMNS.LOG] = attendee.log;

  return row;
}

/**
 * Read all welcome day attendees from the sheet
 */
export async function readAllWelcomeDayAttendees(season?: string): Promise<WelcomeDayAttendee[]> {
  const sheetName = getWelcomeDaySheetName(season);
  const rows = await readRange(sheetName, 'A2:Q');

  return rows.map((row: string[], index: number) => rowToAttendee(row, index + 2));
}

/**
 * Append a new welcome day attendee
 */
export async function appendWelcomeDayAttendee(
  data: WelcomeDayAttendee,
  season?: string
): Promise<void> {
  const sheetName = getWelcomeDaySheetName(season);
  const row = attendeeToRow(data);
  await appendToSheet(sheetName, 'A:Q', [row]);
}

/**
 * Batch append multiple welcome day attendees
 */
export async function batchAppendWelcomeDayAttendees(
  attendees: WelcomeDayAttendee[],
  season?: string
): Promise<void> {
  const sheetName = getWelcomeDaySheetName(season);
  const rows = attendees.map((a) => attendeeToRow(a));
  await appendToSheet(sheetName, 'A:Q', rows);
}

/**
 * Update a specific welcome day attendee row
 */
export async function updateWelcomeDayAttendee(
  rowIndex: number,
  data: WelcomeDayAttendee,
  season?: string
): Promise<void> {
  const sheetName = getWelcomeDaySheetName(season);
  const row = attendeeToRow(data);
  await updateRange(sheetName, `A${rowIndex}:Q${rowIndex}`, [row]);
}

/**
 * Find a welcome day attendee by email
 */
export async function findWelcomeDayAttendeeByEmail(
  email: string,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  const rows = await readAllWelcomeDayAttendees(season);
  const normalizedEmail = email.toLowerCase().trim();
  return (
    rows.find(
      (row) =>
        row.emailAddress?.toLowerCase().trim() === normalizedEmail ||
        row.email?.toLowerCase().trim() === normalizedEmail
    ) || null
  );
}

/**
 * Find a welcome day attendee by national ID
 */
export async function findWelcomeDayAttendeeByNationalId(
  nationalId: string,
  season?: string
): Promise<WelcomeDayAttendee | null> {
  const rows = await readAllWelcomeDayAttendees(season);
  return rows.find((row) => row.nationalId === nationalId) || null;
}

/**
 * Batch update multiple welcome day attendee rows
 */
export async function batchUpdateWelcomeDayAttendees(
  updates: { rowIndex: number; data: WelcomeDayAttendee }[],
  season?: string
): Promise<void> {
  const sheetName = getWelcomeDaySheetName(season);
  const data = updates.map(({ rowIndex, data }) => ({
    range: `${sheetName}!A${rowIndex}:Q${rowIndex}`,
    values: [attendeeToRow(data)],
  }));

  await batchUpdate(data);
}

/**
 * Get attendees by attendance status
 */
export async function getWelcomeDayAttendeesByAttendance(
  attended: string,
  season?: string
): Promise<WelcomeDayAttendee[]> {
  const allRows = await readAllWelcomeDayAttendees(season);
  const normalizedStatus = attended.trim().toLowerCase();
  return allRows.filter((row) => row.attended?.toLowerCase() === normalizedStatus);
}

/**
 * Get attendees by checked status
 */
export async function getWelcomeDayAttendeesByCheckedStatus(
  status: ValidationStatus | string,
  season?: string
): Promise<WelcomeDayAttendee[]> {
  const allRows = await readAllWelcomeDayAttendees(season);
  return allRows.filter((row) => row.checked === status);
}
