// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Unique ID Generation Module
 * Generates unique 5-digit numeric IDs for applicants
 */

import { getAllExistingIds } from './sheets';

const MAX_RETRIES = 100;

/**
 * Generate a random 5-digit ID
 */
function generateRandomId(): string {
  const num = Math.floor(Math.random() * 100000);
  return num.toString().padStart(5, '0');
}

/**
 * Generate a unique 5-digit ID that doesn't exist in the provided set
 * @param existingIds Optional array of existing IDs to check against
 * @returns A unique 5-digit ID
 * @throws Error if unable to generate unique ID after MAX_RETRIES attempts
 */
export async function generateUniqueId(existingIds?: string[], season?: string): Promise<string> {
  // Fetch existing IDs if not provided
  const existing = existingIds || (await getAllExistingIds(season));
  const existingSet = new Set(existing);

  // Try to generate a unique ID
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = generateRandomId();

    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // If we can't find a random unique ID, try sequential from 00001
  for (let i = 1; i <= 99999; i++) {
    const candidate = i.toString().padStart(5, '0');
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique ID: all 100,000 IDs are taken!');
}

/**
 * Generate multiple unique IDs at once
 * @param count Number of IDs to generate
 * @param existingIds Optional array of existing IDs
 * @returns Array of unique IDs
 */
export async function generateMultipleUniqueIds(
  count: number,
  existingIds?: string[],
  season?: string
): Promise<string[]> {
  const existing = existingIds || (await getAllExistingIds(season));
  const existingSet = new Set(existing);
  const generated: string[] = [];

  for (let i = 0; i < count; i++) {
    let candidate: string;
    let attempts = 0;

    do {
      candidate = generateRandomId();
      attempts++;

      if (attempts > MAX_RETRIES) {
        throw new Error(`Unable to generate unique ID ${i + 1} of ${count}`);
      }
    } while (existingSet.has(candidate) || generated.includes(candidate));

    generated.push(candidate);
    existingSet.add(candidate);
  }

  return generated;
}
