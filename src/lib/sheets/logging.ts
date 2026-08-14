// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export type SheetLogActorInput =
  | string
  | {
      name?: string;
      email?: string;
    };

export interface SheetFieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

function normalizeLogValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'empty';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? 'empty' : trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function resolveActorLabel(actor: SheetLogActorInput): string {
  if (typeof actor === 'string') {
    const trimmed = actor.trim();
    return trimmed || 'system';
  }

  const name = String(actor.name ?? '').trim();
  const email = String(actor.email ?? '').trim();

  if (name && email) {
    return `${name} <${email}>`;
  }

  if (email) {
    return email;
  }

  if (name) {
    return name;
  }

  return 'system';
}

export function collectSheetFieldChanges<T extends object>(
  beforeData: T,
  updates: Partial<T>,
  options?: { ignoreFields?: string[] }
): SheetFieldChange[] {
  const ignored = new Set(options?.ignoreFields ?? []);
  const changes: SheetFieldChange[] = [];

  for (const [field, nextValue] of Object.entries(updates)) {
    if (ignored.has(field)) {
      continue;
    }

    const previousValue = beforeData[field as keyof T];

    if (Object.is(previousValue, nextValue)) {
      continue;
    }

    changes.push({
      field,
      before: previousValue,
      after: nextValue,
    });
  }

  return changes;
}

export function buildSheetUpdateLogEntry(params: {
  actor: SheetLogActorInput;
  changes: SheetFieldChange[];
  action?: string;
  timestamp?: string;
}): string {
  const { actor, changes } = params;

  if (changes.length === 0) {
    return '';
  }

  const action = params.action?.trim() || 'updated';
  const timestamp = params.timestamp || new Date().toISOString();
  const actorLabel = resolveActorLabel(actor);

  const formattedChanges = changes
    .map((change) => {
      const before = normalizeLogValue(change.before);
      const after = normalizeLogValue(change.after);
      return `${change.field} [before: \"${before}\"] [after: \"${after}\"]`;
    })
    .join('; ');

  return `${timestamp} | ${actorLabel} | ${action}: ${formattedChanges}`;
}

export function buildSheetActionLogEntry(params: {
  actor: SheetLogActorInput;
  action: string;
  details?: string;
  timestamp?: string;
}): string {
  const timestamp = params.timestamp || new Date().toISOString();
  const actorLabel = resolveActorLabel(params.actor);
  const action = params.action.trim();
  const details = String(params.details ?? '').trim();

  if (details) {
    return `${timestamp} | ${actorLabel} | ${action}: ${details}`;
  }

  return `${timestamp} | ${actorLabel} | ${action}`;
}

export function appendSheetLogEntry(existingLog: string | undefined, entry: string): string {
  const current = String(existingLog ?? '').trim();
  const normalizedEntry = String(entry ?? '').trim();

  if (!normalizedEntry) {
    return current;
  }

  if (!current) {
    return normalizedEntry;
  }

  return `${current}\n${normalizedEntry}`;
}
