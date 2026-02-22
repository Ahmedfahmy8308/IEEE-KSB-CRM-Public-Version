// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Interview Module
 * Handles interview applicant data operations
 */

import { readRange, appendToSheet, updateRange, batchUpdate, expandSheetColumns } from './base';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '../constants';
import { getInterviewSheetName } from '../season';

// Column mapping for the interview applicant data
// Columns 0-14 are shared between S1 and S2.
// S1 has col 15 = "If yes, mention your role"; S2 removes that column entirely.
const BASE_COLUMNS = {
  TIMESTAMP: 0,
  EMAIL_ADDRESS: 1,
  FULL_NAME: 2,
  EMAIL: 3,
  PHONE_NUMBER: 4,
  NATIONAL_ID: 5,
  AGE: 6,
  CITY: 7,
  ADDRESS: 8,
  PERSONAL_PHOTO_LINK: 9,
  FACULTY: 10,
  DEPARTMENT: 11,
  LEVEL: 12,
  WHAT_KNOW_IEEE: 13,
  BEEN_IEEEAN_BEFORE: 14,
};

// S1 layout: 28 columns (A–AB)
const S1_COLUMNS = {
  ...BASE_COLUMNS,
  IF_YES_ROLE: 15,
  COMMITTEE_APPLYING: 16,
  WHY_COMMITTEE: 17,
  WHY_IEEE_KSB: 18,
  INTERVIEW_DAY: 19,
  INTERVIEW_TIME: 20,
  STATE: 21,
  NOTE: 22,
  ID: 23,
  APPROVED: 24,
  IS_EMAIL_SEND: 25,
  IS_APPROVED_EMAIL_SEND: 26,
  LOG: 27,
  // S2 fields don't exist in S1
  S1_ID_ENTERED: -1,
  ID_VALIDATION_STATUS: -1,
  PULL_SOURCE: -1,
  INTERVIEW_MODE: -1,
};

// S2 layout: 31 columns (A–AE)
// Column P (15) "If yes role" is removed; everything shifts up by 1
// DB columns 0-14 are the same order as S1 (origin form differs, pull route handles mapping)
const S2_COLUMNS = {
  ...BASE_COLUMNS,
  IF_YES_ROLE: -1, // not present in S2 sheet
  COMMITTEE_APPLYING: 15,
  WHY_COMMITTEE: 16,
  WHY_IEEE_KSB: 17,
  INTERVIEW_DAY: 18,
  INTERVIEW_TIME: 19,
  INTERVIEW_MODE: 20,
  STATE: 21,
  NOTE: 22,
  ID: 23,
  S1_ID_ENTERED: 24,
  ID_VALIDATION_STATUS: 25,
  APPROVED: 26,
  IS_EMAIL_SEND: 27,
  IS_APPROVED_EMAIL_SEND: 28,
  PULL_SOURCE: 29,
  LOG: 30,
};

type ColumnMap = typeof S1_COLUMNS | typeof S2_COLUMNS;

/** Return the correct column mapping for the given season */
export function getInterviewColumns(season?: string): ColumnMap {
  return season === 'S2' ? S2_COLUMNS : S1_COLUMNS;
}

/** Return the sheet end-column letter for the given season */
function getEndCol(season?: string): string {
  return season === 'S2' ? 'AE' : 'AB';
}

/** Return the total column count for the given season */
function getColCount(season?: string): number {
  return season === 'S2' ? 31 : 28;
}

// Default export for backward compatibility (S1 layout)
export const INTERVIEW_COLUMNS = S1_COLUMNS;

// Re-export for backward compatibility
export const APPROVED_VALUES = APPROVAL_STATUS;
export const STATE_VALUES = {
  WAIT_IN_RECEPTION: INTERVIEW_STATE.WAIT_IN_RECEPTION,
  IN_INTERVIEW: INTERVIEW_STATE.IN_INTERVIEW,
  COMPLETE_INTERVIEW: INTERVIEW_STATE.COMPLETE_INTERVIEW,
} as const;

export interface InterviewApplicant {
  timestamp: string;
  emailAddress: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  age: string;
  city: string;
  address: string;
  personalPhoto: string;
  faculty: string;
  department: string;
  level: string;
  whatKnowIEEE: string;
  beenIEEEanBefore: string;
  ifYesRole: string;
  trackApplying: string;
  whyCommittee?: string;
  whyIEEEKSB?: string;
  interviewDay?: string;
  interviewTime?: string;
  state?: string;
  note?: string;
  id?: string;
  approved?: string;
  isEmailSend?: boolean;
  isApprovedEmailSend?: boolean;
  log?: string;
  // S2-specific: S1 ID validation fields
  s1IdEntered?: string;
  idValidationStatus?: string;
  pullSource?: string;
  interviewMode?: string; // S2-only: 'Physical' or 'Online'
  rowIndex?: number; // Internal: actual row index in sheet (1-based)
}

/**
 * Validate and normalize approved value
 */
export function normalizeApproved(value: string): string | null {
  const normalized = String(value).toLowerCase();

  if (normalized === 'approved' || normalized === 'yes') return APPROVED_VALUES.APPROVED;
  if (normalized === 'rejected' || normalized === 'no') return APPROVED_VALUES.REJECTED;
  if (normalized === 'pending') return APPROVED_VALUES.PENDING;

  return null;
}

/**
 * Validate and normalize state value
 */
export function normalizeState(value: string): string | null {
  const normalized = String(value).toLowerCase().trim();

  // Allow empty string or "Not Started" for the Not Started state
  if (normalized === '' || normalized === 'not started') return INTERVIEW_STATE.NOT_STARTED;

  // Handle legacy value from old system
  if (normalized === "didn't attend yet") return INTERVIEW_STATE.NOT_STARTED;

  if (normalized === 'wait in reception') return INTERVIEW_STATE.WAIT_IN_RECEPTION;
  if (normalized === 'in interview') return INTERVIEW_STATE.IN_INTERVIEW;
  if (normalized === 'complete interview') return INTERVIEW_STATE.COMPLETE_INTERVIEW;

  // If the value already matches one of our constants exactly, return it as-is
  const exactMatch = Object.values(INTERVIEW_STATE).find((state) => state === value);
  if (exactMatch !== undefined) return exactMatch;

  return null;
}

/**
 * Convert array row to InterviewApplicant object
 */

function rowToApplicant(row: string[], rowIndex: number, season?: string): InterviewApplicant {
  const COLS = getInterviewColumns(season);
  return {
    timestamp: row[COLS.TIMESTAMP] || '',
    emailAddress: row[COLS.EMAIL_ADDRESS] || '',
    fullName: row[COLS.FULL_NAME] || '',
    email: row[COLS.EMAIL] || '',
    phoneNumber: row[COLS.PHONE_NUMBER] || '',
    nationalId: row[COLS.NATIONAL_ID] || '',
    age: row[COLS.AGE] || '',
    city: row[COLS.CITY] || '',
    address: row[COLS.ADDRESS] || '',
    personalPhoto: row[COLS.PERSONAL_PHOTO_LINK] || '',
    faculty: row[COLS.FACULTY] || '',
    department: row[COLS.DEPARTMENT] || '',
    level: row[COLS.LEVEL] || '',
    whatKnowIEEE: row[COLS.WHAT_KNOW_IEEE] || '',
    beenIEEEanBefore: row[COLS.BEEN_IEEEAN_BEFORE] || '',
    ifYesRole: row[COLS.IF_YES_ROLE] || '',
    trackApplying: row[COLS.COMMITTEE_APPLYING] || '',
    whyCommittee: row[COLS.WHY_COMMITTEE] || '',
    whyIEEEKSB: row[COLS.WHY_IEEE_KSB] || '',
    interviewDay: row[COLS.INTERVIEW_DAY] || '',
    interviewTime: row[COLS.INTERVIEW_TIME] || '',
    state: row[COLS.STATE] || '',
    note: row[COLS.NOTE] || '',
    id: row[COLS.ID] || '',
    approved: row[COLS.APPROVED] || '',
    isEmailSend: row[COLS.IS_EMAIL_SEND] === 'TRUE',
    isApprovedEmailSend: row[COLS.IS_APPROVED_EMAIL_SEND] === 'TRUE',
    log: row[COLS.LOG] || '',
    s1IdEntered: COLS.S1_ID_ENTERED >= 0 ? row[COLS.S1_ID_ENTERED] || '' : '',
    idValidationStatus: COLS.ID_VALIDATION_STATUS >= 0 ? row[COLS.ID_VALIDATION_STATUS] || '' : '',
    pullSource: COLS.PULL_SOURCE >= 0 ? row[COLS.PULL_SOURCE] || '' : '',
    interviewMode: COLS.INTERVIEW_MODE >= 0 ? row[COLS.INTERVIEW_MODE] || '' : '',
    rowIndex,
  };
}

/**
 * Convert InterviewApplicant object to array row
 */

function applicantToRow(applicant: InterviewApplicant, season?: string): (string | boolean)[] {
  const COLS = getInterviewColumns(season);
  const row = new Array(getColCount(season)).fill('');

  if (applicant.timestamp) row[COLS.TIMESTAMP] = applicant.timestamp;
  if (applicant.emailAddress) row[COLS.EMAIL_ADDRESS] = applicant.emailAddress;
  if (applicant.fullName) row[COLS.FULL_NAME] = applicant.fullName;
  if (applicant.email) row[COLS.EMAIL] = applicant.email;
  if (applicant.phoneNumber) row[COLS.PHONE_NUMBER] = applicant.phoneNumber;
  if (applicant.nationalId) row[COLS.NATIONAL_ID] = applicant.nationalId;
  if (applicant.age) row[COLS.AGE] = applicant.age;
  if (applicant.city) row[COLS.CITY] = applicant.city;
  if (applicant.address) row[COLS.ADDRESS] = applicant.address;
  if (applicant.personalPhoto) row[COLS.PERSONAL_PHOTO_LINK] = applicant.personalPhoto;
  if (applicant.faculty) row[COLS.FACULTY] = applicant.faculty;
  if (applicant.department) row[COLS.DEPARTMENT] = applicant.department;
  if (applicant.level) row[COLS.LEVEL] = applicant.level;
  if (applicant.whatKnowIEEE) row[COLS.WHAT_KNOW_IEEE] = applicant.whatKnowIEEE;
  if (applicant.beenIEEEanBefore) row[COLS.BEEN_IEEEAN_BEFORE] = applicant.beenIEEEanBefore;
  if (applicant.ifYesRole) row[COLS.IF_YES_ROLE] = applicant.ifYesRole;
  if (applicant.trackApplying) row[COLS.COMMITTEE_APPLYING] = applicant.trackApplying;
  if (applicant.whyCommittee) row[COLS.WHY_COMMITTEE] = applicant.whyCommittee;
  if (applicant.whyIEEEKSB) row[COLS.WHY_IEEE_KSB] = applicant.whyIEEEKSB;
  if (applicant.interviewDay) row[COLS.INTERVIEW_DAY] = applicant.interviewDay;
  if (applicant.interviewTime) row[COLS.INTERVIEW_TIME] = applicant.interviewTime;
  if (applicant.state) row[COLS.STATE] = applicant.state;
  if (applicant.note) row[COLS.NOTE] = applicant.note;
  if (applicant.id) row[COLS.ID] = applicant.id;
  if (applicant.approved) row[COLS.APPROVED] = applicant.approved;
  row[COLS.IS_EMAIL_SEND] = applicant.isEmailSend ? 'TRUE' : 'FALSE';
  row[COLS.IS_APPROVED_EMAIL_SEND] = applicant.isApprovedEmailSend ? 'TRUE' : 'FALSE';
  if (applicant.log) row[COLS.LOG] = applicant.log;
  if (COLS.S1_ID_ENTERED >= 0 && applicant.s1IdEntered)
    row[COLS.S1_ID_ENTERED] = applicant.s1IdEntered;
  if (COLS.ID_VALIDATION_STATUS >= 0 && applicant.idValidationStatus)
    row[COLS.ID_VALIDATION_STATUS] = applicant.idValidationStatus;
  if (COLS.PULL_SOURCE >= 0 && applicant.pullSource) row[COLS.PULL_SOURCE] = applicant.pullSource;
  if (COLS.INTERVIEW_MODE >= 0 && applicant.interviewMode)
    row[COLS.INTERVIEW_MODE] = applicant.interviewMode;

  return row;
}

/**
 * Read all interview applicants from the sheet
 */
export async function readAllInterviewApplicants(season?: string): Promise<InterviewApplicant[]> {
  const sheetName = getInterviewSheetName(season);
  const endCol = getEndCol(season);
  const rows = await readRange(sheetName, `A2:${endCol}`);

  return rows.map((row: string[], index: number) => rowToApplicant(row, index + 2, season));
}

/**
 * Get all applicants for a specific committee (handles multiple comma-separated committees)
 */
export async function getInterviewApplicantsByCommittee(
  committee: string,
  season?: string
): Promise<InterviewApplicant[]> {
  const allRows = await readAllInterviewApplicants(season);
  const normalizedCommittee = committee.trim().toLowerCase();
  return allRows.filter((row) => {
    if (!row.trackApplying) return false;
    // Split by comma, trim, and match case-insensitive
    const committees = row.trackApplying.split(',').map((c) => c.trim().toLowerCase());
    return committees.includes(normalizedCommittee);
  });
}

/**
 * Append a new interview applicant
 */
export async function appendInterviewApplicant(
  data: InterviewApplicant,
  season?: string
): Promise<void> {
  const sheetName = getInterviewSheetName(season);
  const endCol = getEndCol(season);
  const row = applicantToRow(data, season);
  await appendToSheet(sheetName, `A:${endCol}`, [row]);
}

/**
 * Batch-append multiple interview applicants in a single API call.
 * Avoids Google Sheets per-minute write quota issues.
 */
export async function batchAppendInterviewApplicants(
  applicants: InterviewApplicant[],
  season?: string
): Promise<void> {
  if (applicants.length === 0) return;
  const sheetName = getInterviewSheetName(season);
  const endCol = getEndCol(season);
  const rows = applicants.map((a) => applicantToRow(a, season));
  await appendToSheet(sheetName, `A:${endCol}`, rows);
}

/**
 * Ensure the S2 sheet has 30 columns with correct headers.
 * Expands the grid if needed, then verifies headers exist.
 */
export async function ensureS2Headers(season?: string): Promise<void> {
  const sheetName = getInterviewSheetName(season);

  // 31 columns needed (A=1 ... AE=31)
  await expandSheetColumns(sheetName, 31);

  // Read current header row
  const headerRows = await readRange(sheetName, 'A1:AE1');
  const headers = headerRows[0] || [];

  // Check if S2-specific columns have headers
  const COLS = getInterviewColumns('S2');
  const needsUpdate =
    !headers[COLS.INTERVIEW_MODE] ||
    !headers[COLS.S1_ID_ENTERED] ||
    !headers[COLS.ID_VALIDATION_STATUS] ||
    !headers[COLS.PULL_SOURCE];

  if (needsUpdate) {
    // Write headers from U (col 20 = Interview Mode) through AE (col 30 = Log)
    await updateRange(sheetName, 'U1:AE1', [
      [
        'Interview Mode',
        'state',
        'Note',
        'ID',
        'S1 ID Entered',
        'ID Validation Status',
        'Approved',
        'IS EmailSend',
        'Is Approved Email Send',
        'Pull Source',
        'Log',
      ],
    ]);
  }
}

/**
 * Update a specific interview applicant row
 */
export async function updateInterviewApplicant(
  rowIndex: number,
  data: InterviewApplicant,
  season?: string
): Promise<void> {
  const sheetName = getInterviewSheetName(season);
  const endCol = getEndCol(season);
  const row = applicantToRow(data, season);
  await updateRange(sheetName, `A${rowIndex}:${endCol}${rowIndex}`, [row]);
}

/**
 * Find an interview applicant by ID
 */
export async function findInterviewApplicantById(
  id: string,
  season?: string
): Promise<InterviewApplicant | null> {
  const rows = await readAllInterviewApplicants(season);
  return rows.find((row) => row.id === id) || null;
}

/**
 * Get all existing interview IDs
 */
export async function getAllInterviewIds(season?: string): Promise<string[]> {
  const rows = await readAllInterviewApplicants(season);
  return rows.map((row) => row.id).filter((id) => id) as string[];
}

/**
 * Get the next unique ID candidate for interviews
 */
export async function getNextInterviewIdCandidate(season?: string): Promise<string> {
  const existingIds = await getAllInterviewIds(season);

  if (existingIds.length === 0) {
    return '00001';
  }

  // Find the highest numeric ID
  const numericIds = existingIds
    .map((id) => parseInt(id, 10))
    .filter((num) => !isNaN(num))
    .sort((a, b) => b - a);

  if (numericIds.length === 0) {
    return '00001';
  }

  const nextId = numericIds[0] + 1;
  return nextId.toString().padStart(5, '0');
}

/**
 * Batch update multiple interview applicant rows
 */
export async function batchUpdateInterviewApplicants(
  updates: { rowIndex: number; data: InterviewApplicant }[],
  season?: string
): Promise<void> {
  const sheetName = getInterviewSheetName(season);
  const endCol = getEndCol(season);
  const data = updates.map(({ rowIndex, data }) => ({
    range: `${sheetName}!A${rowIndex}:${endCol}${rowIndex}`,
    values: [applicantToRow(data, season)],
  }));

  await batchUpdate(data);
}

// Re-export types for backward compatibility
export type ApplicantRow = InterviewApplicant;
export const COLUMNS = INTERVIEW_COLUMNS;
export const readAllRows = readAllInterviewApplicants;
export const getApplicantsByCommittee = getInterviewApplicantsByCommittee;
export const appendRow = appendInterviewApplicant;
export const updateRow = updateInterviewApplicant;
export const findRowById = findInterviewApplicantById;
export const getAllExistingIds = getAllInterviewIds;
export const getNextUniqueIdCandidate = getNextInterviewIdCandidate;
export const batchUpdateRows = batchUpdateInterviewApplicants;
