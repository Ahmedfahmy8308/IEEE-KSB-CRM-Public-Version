// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Authentication Module
 * Handles user authentication and JWT token management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/sheets/Users';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRY = '7d';

export type UserRole = 'ChairMan' | 'highboard' | 'board';

export interface User {
  username: string;
  role: UserRole;
  name?: string;
  position?: string;
  committee?: string;
  accessSeason?: string;
}

export interface JWTPayload extends User {
  iat: number;
  exp: number;
}

/**
 * Verify user credentials
 * @param username Username (Email)
 * @param password Password
 * @returns User object if credentials are valid, null otherwise
 */
export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  // Validate input
  if (!username || !password) {
    return null;
  }

  // Normalize email
  const normalizedEmail = username.toLowerCase().trim();

  // Choose authentication source based on feature flag
  let account;

  try {
    const dbUser = await findUserByEmail(normalizedEmail);
    if (dbUser) {
      account = {
        Email: dbUser.email,
        password: dbUser.password,
        name: dbUser.name,
        role: dbUser.role,
        position: dbUser.position,
        committee: dbUser.committee,
        accessSeason: dbUser.accessSeason,
      };
    }
  } catch (error) {
    console.error('Error accessing user database:', error);

    // Check if this is a Google Sheets authentication error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('account not found')) {
      console.error(
        'Google Service Account authentication failed. Please check your credentials in .env file:'
      );
      console.error(
        '- GOOGLE_SERVICE_ACCOUNT_EMAIL should be in format: name@project-id.iam.gserviceaccount.com'
      );
      console.error(
        '- GOOGLE_PRIVATE_KEY should be a valid private key from the service account JSON'
      );
      console.error('- Verify the service account exists in Google Cloud Console');
    }

    account = undefined;
  }

  if (!account) {
    console.error(`Authentication failed for user: ${normalizedEmail}`);
    return null;
  }

  // Check password (supports both plain text for development and bcrypt hashes)
  let isPasswordValid = false;

  if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
    // Bcrypt hash
    isPasswordValid = await bcrypt.compare(password, account.password);
  } else {
    // Plain text (development only!)
    isPasswordValid = password === account.password;
  }

  if (!isPasswordValid) {
    return null;
  }

  return {
    username: account.Email,
    role: account.role,
    name: account.name,
    position: account.position,
    committee: account.committee,
    accessSeason: account.accessSeason,
  };
}

/**
 * Issue a JWT token for a user
 * @param user User object
 * @returns JWT token string
 */
export function issueJwt(user: User): string {
  const payload = {
    username: user.username,
    role: user.role,
    name: user.name,
    position: user.position,
    committee: user.committee,
    accessSeason: user.accessSeason,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded user object or null if invalid
 */
export function verifyJwt(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    return {
      username: decoded.username,
      role: decoded.role,
      name: decoded.name,
      position: decoded.position,
      committee: decoded.committee,
      accessSeason: decoded.accessSeason,
    };
  } catch {
    return null;
  }
}

/**
 * Extract user from cookie value
 * @param cookieValue Cookie string value
 * @returns User object or null
 */
export function getUserFromCookie(cookieValue: string | undefined): User | null {
  if (!cookieValue) {
    return null;
  }

  return verifyJwt(cookieValue);
}

/**
 * Check if user can edit
 * @param user User object
 * @returns True if user can edit
 * - ChairMan: Can edit (full access to all fields)
 * - Highboard: Can edit (limited to state, note, approved fields)
 * - Board: Can edit (limited to state, note, approved fields for their committee only)
 */
export function canEdit(user: User): boolean {
  return user.role === 'ChairMan' || user.role === 'highboard' || user.role === 'board';
}

/**
 * Check if user can access member data (view)
 * @param user User object
 * @param memberCommittee Member's committee (can be comma-separated)
 * @returns True if user can access/view the member
 * - ChairMan: Can see ALL members
 * - Highboard: Can see ALL members
 * - Board: Can see ONLY members from their committee
 */
export function canAccessMember(user: User, memberCommittee: string): boolean {
  // ChairMan and highboard can access all members
  if (user.role === 'ChairMan' || user.role === 'highboard') {
    return true;
  }

  // Board members can only access their own committee
  if (user.role === 'board') {
    // Validate that user has a committee assigned
    if (!user.committee) {
      return false;
    }

    // Check if member's committee matches user's committee
    // Member can have multiple committees separated by comma
    if (!memberCommittee) {
      return false;
    }

    const memberCommittees = memberCommittee.split(',').map((c) => c.trim().toLowerCase());
    const userCommittee = user.committee.toLowerCase();

    return memberCommittees.includes(userCommittee);
  }

  return false;
}

/**
 * Check if user can update all fields (full edit access)
 * @param user User object
 * @returns True if user can update all fields
 * - ChairMan: Can update ALL fields
 * - Highboard: Cannot update all fields (limited)
 * - Board: Cannot update all fields (limited)
 */
export function canEditAllFields(user: User): boolean {
  return user.role === 'ChairMan';
}

/**
 * Get allowed fields that user can edit
 * @param user User object
 * @returns Array of field names user can edit, or 'all' for full access
 */
export function getAllowedEditFields(user: User): string[] | 'all' {
  if (user.role === 'ChairMan') {
    return 'all'; // Can edit all fields
  }

  if (user.role === 'highboard' || user.role === 'board') {
    // Both highboard and board can only edit these fields
    return ['state', 'note', 'approved'];
  }

  return []; // No edit permissions
}

/**
 * Check if user can access Welcome Day attendee data (view)
 * @param user User object
 * @param attendeeCommittee Attendee's committee
 * @returns True if user can access/view the attendee
 * - ChairMan: Can see ALL attendees
 * - Highboard: Can see ALL attendees
 * - Board: Can see ONLY attendees from their committee
 */
export function canAccessWelcomeDayAttendee(user: User, attendeeCommittee: string): boolean {
  // ChairMan and highboard can access all attendees
  if (user.role === 'ChairMan' || user.role === 'highboard') {
    return true;
  }

  // Board members can only access their own committee
  if (user.role === 'board') {
    // Validate that user has a committee assigned
    if (!user.committee) {
      return false;
    }

    // Check if attendee's committee matches user's committee
    if (!attendeeCommittee) {
      return false;
    }

    return attendeeCommittee.toLowerCase() === user.committee.toLowerCase();
  }

  return false;
}

/**
 * Check if user can view sensitive Welcome Day data (payment screenshot, national ID)
 * @param user User object
 * @returns True if user can view sensitive data
 * - ChairMan: Can view sensitive data
 * - Highboard: Cannot view sensitive data
 * - Board: Cannot view sensitive data
 */
export function canViewSensitiveWelcomeDayData(user: User): boolean {
  return user.role === 'ChairMan';
}
