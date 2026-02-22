// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Base Google Sheets Module
 * Shared authentication and utilities for all sheet modules
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SHEET_ID = process.env.SHEET_ID!;
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Google Sheets API client type from googleapis
type SheetsClient = ReturnType<typeof google.sheets>;
let sheetsClient: SheetsClient | null = null;

/**
 * Initialize Google Sheets API client (singleton)
 */
export function getSheets() {
  if (sheetsClient) return sheetsClient;

  let auth;

  // Option 1: Use environment variables (for Vercel/production)
  if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
    // Replace \n literals with actual newlines in the private key
    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  // Option 2: Use service account key file (for local development)
  else if (SERVICE_ACCOUNT_KEY_PATH) {
    const keyFilePath = path.resolve(process.cwd(), SERVICE_ACCOUNT_KEY_PATH);

    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found at: ${keyFilePath}`);
    }

    auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } else {
    throw new Error(
      'Google Sheets authentication not configured. ' +
        'Please set either GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY, ' +
        'or GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variables.'
    );
  }

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Get the spreadsheet ID
 */
export function getSpreadsheetId(): string {
  return SHEET_ID;
}

/**
 * Get all sheet names in the spreadsheet (for debugging)
 */
export async function getAllSheetNames(): Promise<string[]> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties.title',
  });

  return (
    response.data.sheets
      ?.map((sheet: { properties?: { title?: string | null } }) => sheet.properties?.title)
      .filter((t): t is string => typeof t === 'string') || []
  );
}

/**
 * Read values from a specific range
 */

export async function readRange(sheetName: string, range: string): Promise<string[][]> {
  const sheets = getSheets();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!${range}`,
    });

    return response.data.values || [];
  } catch (error) {
    // If range parsing fails, list available sheets to help debug
    const err = error as { code?: number; message?: string };
    if (err.code === 400 && err.message?.includes('Unable to parse range')) {
      const availableSheets = await getAllSheetNames();
      throw new Error(
        `Unable to find sheet "${sheetName}". Available sheets: ${availableSheets.join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Append values to a specific sheet.
 * Finds the first empty row after existing data and writes there using `update`.
 * This avoids the unreliable table-boundary detection of `values.append`.
 */

export async function appendToSheet(
  sheetName: string,
  _range: string,
  values: (string | boolean)[][]
): Promise<void> {
  const sheets = getSheets();

  // Read column A to find the last row with data
  const col = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  });

  // Row 1 is headers, data starts at row 2.
  // Length of column A values = last occupied row number.
  const lastRow = col.data.values ? col.data.values.length : 1;
  const startRow = lastRow + 1; // first empty row

  // Determine end column from the range hint (e.g. "A:AE" → "AE")
  const endCol = _range.includes(':') ? _range.split(':')[1].replace(/[0-9]/g, '') : 'AE';
  const endRow = startRow + values.length - 1;

  // Expand grid rows if needed (similar to expandSheetColumns)
  await expandSheetRows(sheetName, endRow);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${startRow}:${endCol}${endRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

/**
 * Update values in a specific range
 */

export async function updateRange(
  sheetName: string,
  range: string,
  values: (string | boolean)[][]
): Promise<void> {
  const sheets = getSheets();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

/**
 * Batch update multiple ranges
 */
export async function batchUpdate(
  updates: { range: string; values: unknown[][] }[]
): Promise<void> {
  const sheets = getSheets();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  });
}

/**
 * Expand the number of rows in a sheet if the current grid is too small.
 */
export async function expandSheetRows(sheetName: string, requiredRows: number): Promise<void> {
  const sheets = getSheets();

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties',
  });

  const sheetMeta = meta.data.sheets?.find(
    (s: { properties?: { title?: string | null } }) => s.properties?.title === sheetName
  );
  if (!sheetMeta) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const currentRows = sheetMeta.properties?.gridProperties?.rowCount || 0;
  if (currentRows >= requiredRows) return; // already tall enough

  const rowsToAdd = requiredRows - currentRows;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          appendDimension: {
            sheetId: sheetMeta.properties?.sheetId,
            dimension: 'ROWS',
            length: rowsToAdd,
          },
        },
      ],
    },
  });
}

/**
 * Expand a sheet's column count if it currently has fewer than the required number.
 * Uses the Sheets API batchUpdate to append extra COLUMNS to the grid.
 */
export async function expandSheetColumns(
  sheetName: string,
  requiredColumns: number
): Promise<void> {
  const sheets = getSheets();

  // Get current sheet metadata to find sheetId and column count
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties',
  });

  const sheetMeta = meta.data.sheets?.find(
    (s: { properties?: { title?: string | null } }) => s.properties?.title === sheetName
  );
  if (!sheetMeta) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const currentCols = sheetMeta.properties?.gridProperties?.columnCount || 0;
  if (currentCols >= requiredColumns) return; // already wide enough

  const colsToAdd = requiredColumns - currentCols;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          appendDimension: {
            sheetId: sheetMeta.properties?.sheetId,
            dimension: 'COLUMNS',
            length: colsToAdd,
          },
        },
      ],
    },
  });
}

/**
 * Read values from an external spreadsheet (different spreadsheet ID)
 * Used for pulling data from origin Google Forms response sheets
 */

export async function readRangeExternal(
  spreadsheetId: string,
  sheetName: string,
  range: string
): Promise<string[][]> {
  const sheets = getSheets();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    });

    return response.data.values || [];
  } catch (error) {
    const err = error as { code?: number; message?: string };
    if (err.code === 400 && err.message?.includes('Unable to parse range')) {
      throw new Error(
        `Unable to read from external sheet "${sheetName}" in spreadsheet ${spreadsheetId}`
      );
    }
    throw error;
  }
}
