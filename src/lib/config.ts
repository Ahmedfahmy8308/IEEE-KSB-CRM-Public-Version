// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Runtime Config Module
 * Reads/writes config.json for settings that the Chairman can edit via UI.
 * Secrets (API keys, SMTP credentials, JWT) stay in .env.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface AppConfig {
  sheetNames: {
    interview_s1: string;
    interview_s2: string;
    welcome_day_s1: string;
    welcome_day_s2: string;
    users: string;
  };
  email: {
    batchSize: number;
    batchDelayMs: number;
    testEmail: string;
  };
  pull: {
    interview_s1: PullSeasonConfig;
    interview_s2: PullSeasonConfig;
    welcome_day_s1: PullSeasonConfig;
    welcome_day_s2: PullSeasonConfig;
  };
}

export interface PullSeasonConfig {
  active: boolean;
  originSheetId: string;
  originTabName: string;
}

const DEFAULT_CONFIG: AppConfig = {
  sheetNames: {
    interview_s1: 'Interview_Season_1',
    interview_s2: 'Interview_Season_2',
    welcome_day_s1: 'Welcome_Day_Season_1',
    welcome_day_s2: 'Welcome_Day_Season_2',
    users: 'Users',
  },
  email: {
    batchSize: 21,
    batchDelayMs: 2000,
    testEmail: '',
  },
  pull: {
    interview_s1: { active: false, originSheetId: '', originTabName: '' },
    interview_s2: { active: false, originSheetId: '', originTabName: '' },
    welcome_day_s1: { active: false, originSheetId: '', originTabName: '' },
    welcome_day_s2: { active: false, originSheetId: '', originTabName: '' },
  },
};

/**
 * Read the current config from disk.
 * Falls back to defaults if config.json is missing or malformed.
 */
export function getConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Deep merge with defaults so new fields are always present
    return deepMerge(
      DEFAULT_CONFIG as unknown as Record<string, unknown>,
      parsed
    ) as unknown as AppConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Write updated config to disk.
 * Merges the partial update with the current config.
 */
export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const current = getConfig();
  const merged = deepMerge(
    current as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>
  ) as unknown as AppConfig;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
