// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Validation Module
 * Functions to find duplicates and mismatches in applicant data
 */

import type { ApplicantRow } from './sheets';

/**
 * Normalize phone number by removing non-digits
 * Handles leading zeros and country codes
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Remove leading country code if present (e.g., +20 for Egypt becomes 20)
  // This is a simple heuristic; adjust based on your needs
  if (digits.startsWith('20') && digits.length > 10) {
    return digits.substring(2);
  }

  return digits;
}

/**
 * Find applicants with duplicate phone numbers
 * @param applicants Array of applicant data
 * @returns Array of groups of duplicates
 */
export function findDuplicatePhones(applicants: ApplicantRow[]): Array<{
  phone: string;
  normalizedPhone: string;
  members: Array<{ id: string; fullName: string; email: string }>;
}> {
  const phoneMap = new Map<string, ApplicantRow[]>();

  for (const applicant of applicants) {
    if (!applicant.phoneNumber) continue;

    const normalized = normalizePhoneNumber(applicant.phoneNumber);

    if (!phoneMap.has(normalized)) {
      phoneMap.set(normalized, []);
    }

    phoneMap.get(normalized)!.push(applicant);
  }

  // Filter to only include duplicates (2 or more)
  const duplicates: Array<{
    phone: string;
    normalizedPhone: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }> = [];

  for (const [normalized, group] of phoneMap.entries()) {
    if (group.length > 1) {
      duplicates.push({
        phone: group[0].phoneNumber || '',
        normalizedPhone: normalized,
        members: group.map((applicant) => ({
          id: applicant.id || 'N/A',
          fullName: applicant.fullName || 'Unknown',
          email: applicant.email || 'N/A',
        })),
      });
    }
  }

  return duplicates;
}

/**
 * Find applicants with duplicate email addresses
 * @param applicants Array of applicant data
 * @returns Array of groups of duplicates
 */
export function findDuplicateEmails(applicants: ApplicantRow[]): Array<{
  email: string;
  members: Array<{ id: string; fullName: string; email: string }>;
}> {
  const emailMap = new Map<string, ApplicantRow[]>();

  for (const applicant of applicants) {
    if (!applicant.email) continue;

    const normalized = applicant.email.toLowerCase().trim();

    if (!emailMap.has(normalized)) {
      emailMap.set(normalized, []);
    }

    emailMap.get(normalized)!.push(applicant);
  }

  // Filter to only include duplicates
  const duplicates: Array<{
    email: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }> = [];

  for (const [email, group] of emailMap.entries()) {
    if (group.length > 1) {
      duplicates.push({
        email,
        members: group.map((applicant) => ({
          id: applicant.id || 'N/A',
          fullName: applicant.fullName || 'Unknown',
          email: applicant.email || 'N/A',
        })),
      });
    }
  }

  return duplicates;
}

/**
 * Find applicants with duplicate emailAddress (from form submission)
 * @param applicants Array of applicant data
 * @returns Array of groups of duplicates
 */
export function findDuplicateEmailAddresses(applicants: ApplicantRow[]): Array<{
  email: string;
  members: Array<{ id: string; fullName: string; email: string }>;
}> {
  const emailMap = new Map<string, ApplicantRow[]>();

  for (const applicant of applicants) {
    if (!applicant.emailAddress) continue;

    const normalized = applicant.emailAddress.toLowerCase().trim();

    if (!emailMap.has(normalized)) {
      emailMap.set(normalized, []);
    }

    emailMap.get(normalized)!.push(applicant);
  }

  // Filter to only include duplicates
  const duplicates: Array<{
    email: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }> = [];

  for (const [email, group] of emailMap.entries()) {
    if (group.length > 1) {
      duplicates.push({
        email,
        members: group.map((applicant) => ({
          id: applicant.id || 'N/A',
          fullName: applicant.fullName || 'Unknown',
          email: applicant.email || 'N/A',
        })),
      });
    }
  }

  return duplicates;
}

/**
 * Find applicants where emailAddress and email fields don't match
 * @param applicants Array of applicant data
 * @returns Array of applicants with mismatched emails
 */
export function findEmailsMismatchEmailAddress(applicants: ApplicantRow[]): Array<{
  id: string;
  fullName: string;
  email: string;
  emailAddress: string;
}> {
  const mismatches: Array<{
    id: string;
    fullName: string;
    email: string;
    emailAddress: string;
  }> = [];

  for (const applicant of applicants) {
    // Skip if either field is empty
    if (!applicant.emailAddress || !applicant.email) continue;

    const normalizedEmailAddress = applicant.emailAddress.toLowerCase().trim();
    const normalizedEmail = applicant.email.toLowerCase().trim();

    // Check if they don't match
    if (normalizedEmailAddress !== normalizedEmail) {
      mismatches.push({
        id: applicant.id || 'N/A',
        fullName: applicant.fullName || 'Unknown',
        email: applicant.email,
        emailAddress: applicant.emailAddress,
      });
    }
  }

  return mismatches;
}

/**
 * Find all validation issues
 * @param applicants Array of applicant data
 * @returns Object with all validation results
 */
export function runAllValidations(applicants: ApplicantRow[]): {
  duplicatePhones: ReturnType<typeof findDuplicatePhones>;
  duplicateEmails: ReturnType<typeof findDuplicateEmails>;
  duplicateEmailAddresses: ReturnType<typeof findDuplicateEmailAddresses>;
  emailMismatches: ReturnType<typeof findEmailsMismatchEmailAddress>;
} {
  return {
    duplicatePhones: findDuplicatePhones(applicants),
    duplicateEmails: findDuplicateEmails(applicants),
    duplicateEmailAddresses: findDuplicateEmailAddresses(applicants),
    emailMismatches: findEmailsMismatchEmailAddress(applicants),
  };
}
