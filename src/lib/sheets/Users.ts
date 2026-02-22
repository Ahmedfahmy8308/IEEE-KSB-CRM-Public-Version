// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Database Module
 * Handles user accounts stored in Google Sheets
 */

import { readRange, appendToSheet, updateRange } from './base';
import { getConfig } from '@/lib/config';
import type { UserRole } from '../auth';

function getUsersSheetName(): string {
  return getConfig().sheetNames.users;
}

// Column mapping for user accounts
export const USER_COLUMNS = {
  EMAIL: 0,
  PASSWORD: 1,
  NAME: 2,
  ROLE: 3,
  POSITION: 4,
  COMMITTEE: 5,
  ACCESS_SEASON: 6,
};

export interface UserAccount {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  position: string;
  committee?: string;
  accessSeason?: string;
  rowIndex?: number; // Internal: actual row index in sheet (1-based)
}

/**
 * Convert array row to UserAccount object
 */

function rowToUser(row: string[], rowIndex: number): UserAccount {
  return {
    email: row[USER_COLUMNS.EMAIL] || '',
    password: row[USER_COLUMNS.PASSWORD] || '',
    name: row[USER_COLUMNS.NAME] || '',
    role: (row[USER_COLUMNS.ROLE] || 'member') as UserRole,
    position: row[USER_COLUMNS.POSITION] || '',
    committee: row[USER_COLUMNS.COMMITTEE] || undefined,
    accessSeason: row[USER_COLUMNS.ACCESS_SEASON] || 'all',
    rowIndex,
  };
}

/**
 * Convert UserAccount object to array row
 */

function userToRow(user: UserAccount): (string | boolean)[] {
  const row = new Array(7).fill('');

  row[USER_COLUMNS.EMAIL] = user.email;
  row[USER_COLUMNS.PASSWORD] = user.password;
  row[USER_COLUMNS.NAME] = user.name;
  row[USER_COLUMNS.ROLE] = user.role;
  row[USER_COLUMNS.POSITION] = user.position;
  row[USER_COLUMNS.COMMITTEE] = user.committee || '';
  row[USER_COLUMNS.ACCESS_SEASON] = user.accessSeason || 'all';

  return row;
}

/**
 * Read all user accounts from the database sheet
 */
export async function readAllUsers(): Promise<UserAccount[]> {
  const rows = await readRange(getUsersSheetName(), 'A2:G');

  return rows.map((row: string[], index: number) => rowToUser(row, index + 2));
}

/**
 * Find a user account by email
 */
export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  const users = await readAllUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Get all user accounts (without passwords) for display
 */
export async function getAllUsersWithoutPasswords(): Promise<Omit<UserAccount, 'password'>[]> {
  const users = await readAllUsers();

  return users.map(({ password: _password, ...rest }) => rest);
}

/**
 * Append a new user account
 */
export async function appendUser(user: UserAccount): Promise<void> {
  const row = userToRow(user);
  await appendToSheet(getUsersSheetName(), 'A:F', [row]);
}

/**
 * Update a user account
 */
export async function updateUser(rowIndex: number, user: UserAccount): Promise<void> {
  const row = userToRow(user);
  await updateRange(getUsersSheetName(), `A${rowIndex}:G${rowIndex}`, [row]);
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole): Promise<UserAccount[]> {
  const users = await readAllUsers();
  return users.filter((user) => user.role === role);
}

/**
 * Get users by committee
 */
export async function getUsersByCommittee(committee: string): Promise<UserAccount[]> {
  const users = await readAllUsers();
  const normalizedCommittee = committee.trim().toLowerCase();
  return users.filter((user) => user.committee?.toLowerCase() === normalizedCommittee);
}
