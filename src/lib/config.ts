// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Runtime Config Module
 * Reads/writes config from Google Sheets "_Config!A1" tab.
 * Works identically on local dev and Vercel.
 * Secrets (API keys, SMTP credentials, JWT) stay in .env.
 */

// In-memory cache — avoids hitting Sheets API on every call within the same invocation
let memoryCache: AppConfig | null = null;
let sheetsLoadAttempted = false;

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
  lastPullTimestamp?: string;
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
 * Read the current config from in-memory cache.
 * Must call ensureConfigLoaded() first (done automatically in middleware).
 * Falls back to defaults if not yet loaded.
 */
export function getConfig(): AppConfig {
  if (memoryCache) return memoryCache;
  return { ...DEFAULT_CONFIG };
}

/**
 * Load config from Google Sheets _Config!A1 on startup.
 * Called once per invocation from the auth middleware.
 * Creates the _Config tab with defaults if it doesn't exist.
 */
export async function ensureConfigLoaded(): Promise<void> {
  if (sheetsLoadAttempted) return;
  sheetsLoadAttempted = true;

  try {
    const { getSheets, getSpreadsheetId } = await import('@/lib/sheets/base');
    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '_Config!A1',
    });

    const cell = response.data.values?.[0]?.[0];
    if (cell) {
      const parsed = JSON.parse(cell);
      memoryCache = deepMerge(
        DEFAULT_CONFIG as unknown as Record<string, unknown>,
        parsed
      ) as unknown as AppConfig;
    } else {
      // Cell empty — write defaults
      memoryCache = { ...DEFAULT_CONFIG };
      await persistConfigToSheets(memoryCache);
    }
  } catch {
    // _Config sheet likely doesn't exist — create it with defaults
    try {
      memoryCache = { ...DEFAULT_CONFIG };
      await createConfigSheet();
      await persistConfigToSheets(memoryCache);
    } catch (createErr) {
      console.error('Failed to create _Config sheet:', createErr);
      memoryCache = { ...DEFAULT_CONFIG };
    }
  }
}

/**
 * Write updated config.
 * Merges the partial update with the current config, then persists to Sheets.
 */
export async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = getConfig();
  const merged = deepMerge(
    current as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>
  ) as unknown as AppConfig;
  memoryCache = merged;

  // Persist to Google Sheets (awaited to ensure it completes)
  await persistConfigToSheets(merged);

  return merged;
}

/**
 * Create the _Config sheet tab in the main spreadsheet.
 */
async function createConfigSheet(): Promise<void> {
  const { getSheets, getSpreadsheetId } = await import('@/lib/sheets/base');
  const sheets = getSheets();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title: '_Config' },
          },
        },
      ],
    },
  });
}

/**
 * Write the full config JSON to Google Sheets _Config!A1.
 */
async function persistConfigToSheets(config: AppConfig): Promise<void> {
  const { getSheets, getSpreadsheetId } = await import('@/lib/sheets/base');
  const sheets = getSheets();
  const json = JSON.stringify(config);
  console.log('[Config] Persisting to Sheets, length:', json.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: '_Config!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[json]],
    },
  });
  console.log('[Config] Successfully persisted to Sheets');
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
