// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Season Module
 * Handles season-based routing and sheet name resolution
 */

import { getConfig } from '@/lib/config';

/**
 * Valid season identifiers
 */
export const SEASONS = ['S1', 'S2'] as const;
export type Season = (typeof SEASONS)[number];

/**
 * Season display labels
 */
export const SEASON_LABELS: Record<Season, string> = {
  S1: 'Season 1',
  S2: 'Season 2',
};

/**
 * Map season to Interview sheet name
 */
export function getInterviewSheetName(season?: string): string {
  const cfg = getConfig();
  if (!season || season === 'S1') {
    return cfg.sheetNames.interview_s1;
  }
  if (season === 'S2') {
    return cfg.sheetNames.interview_s2;
  }
  throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(', ')}`);
}

/**
 * Map season to Welcome Day sheet name
 */
export function getWelcomeDaySheetName(season?: string): string {
  const cfg = getConfig();
  if (!season || season === 'S1') {
    return cfg.sheetNames.welcome_day_s1;
  }
  if (season === 'S2') {
    return cfg.sheetNames.welcome_day_s2;
  }
  throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(', ')}`);
}

/**
 * Validate a season string
 */
export function isValidSeason(season: string): season is Season {
  return SEASONS.includes(season as Season);
}

/**
 * Parse ACCESS_SEASON field from user record
 * Returns array of allowed seasons
 */
export function parseAccessSeason(accessSeason: string | undefined): Season[] {
  if (!accessSeason || accessSeason.toLowerCase() === 'all') {
    return [...SEASONS]; // All seasons
  }

  // Support comma-separated values like "S1,S2"
  const parts = accessSeason.split(',').map((s) => s.trim().toUpperCase());
  const valid = parts.filter((s) => isValidSeason(s)) as Season[];

  return valid.length > 0 ? valid : [...SEASONS]; // Default to all if invalid
}

/**
 * Check if a user has access to a specific season
 */
export function hasSeasonAccess(accessSeason: string | undefined, season: string): boolean {
  const allowed = parseAccessSeason(accessSeason);
  return allowed.includes(season as Season);
}

/**
 * Extract season from search params / query string
 * Returns validated season or throws
 */
export function extractSeason(searchParams: URLSearchParams): string {
  const season = searchParams.get('season');
  if (!season) {
    throw new Error('Missing required query parameter: season');
  }
  if (!isValidSeason(season)) {
    throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(', ')}`);
  }
  return season;
}
