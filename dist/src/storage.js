import { createWorkspace, validateWorkspace, migrateWorkspace, jsonByteLength, LIMITS, SCHEMA_VERSION, ValidationError } from './model.js';

export const STORAGE_KEY = 'steptrace.workspace.v1';
export const BACKUP_FORMAT = 'steptrace-backup';
export { LIMITS };

function parseJson(text, label) {
  if (typeof text !== 'string' || jsonByteLength(text) > LIMITS.payloadBytes) {
    throw new ValidationError(`${label} must be text no larger than 2 MiB.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError(`${label} is not valid JSON. Choose an unmodified StepTrace JSON backup.`);
  }
}

function storageError(error, action) {
  if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return `Browser storage is full. ${action} failed; the previous stored workspace is unchanged. Export a backup of your current work.`;
  }
  return `Browser storage is unavailable. ${action} failed. Keep this page open and export a backup of your current work.`;
}

// expectedRaw is the exact string returned by load or the last successful save.
// A changed string means another tab may have edited the same workspace.
export function createStorage(getStorage = () => globalThis.localStorage) {
  let loaded = false;
  let blockedReason = null;
  return {
    load() {
      let raw = null;
      loaded = true;
      try {
        const storage = getStorage();
        raw = storage.getItem(STORAGE_KEY);
        const stored = raw === null ? null : parseJson(raw, 'Stored workspace');
        const workspace = raw === null ? createWorkspace() : migrateWorkspace(stored);
        const migrated = stored !== null && [1, 2].includes(stored?.schemaVersion);
        blockedReason = null;
        // Migration is read-only until an explicit user action saves. expectedRaw
        // continues to be the exact old bytes, protecting recoverability/conflicts.
        return { workspace, raw, error: null, blocked: false, migrated };
      } catch (error) {
        blockedReason = error instanceof ValidationError
          ? `Stored workspace could not be opened: ${error.message} Existing stored data has been left untouched. Export it for recovery before clearing browser data.`
          : storageError(error, 'Loading');
        return { workspace: createWorkspace(), raw, error: blockedReason, blocked: true, migrated: false };
      }
    },
    save(workspace, expectedRaw) {
      if (!loaded || blockedReason) {
        return { ok: false, raw: expectedRaw ?? null, blocked: true,
          error: blockedReason || 'Load browser storage before saving. No stored data was changed.' };
      }
      let raw;
      try {
        raw = JSON.stringify(validateWorkspace(workspace));
      } catch (error) {
        return { ok: false, raw: expectedRaw ?? null, error: `Save failed: ${error.message}`, blocked: false };
      }
      let storage;
      let currentRaw;
      try {
        storage = getStorage();
        currentRaw = storage.getItem(STORAGE_KEY);
      } catch (error) {
        blockedReason = storageError(error, 'Saving');
        return { ok: false, raw: expectedRaw ?? null, error: blockedReason, blocked: true };
      }
      if (currentRaw !== expectedRaw) {
        blockedReason = 'Browser storage changed in another tab or outside this page. Save stopped to protect that work. Export this page’s work, then reload and review before restoring.';
        return { ok: false, raw: expectedRaw ?? null, error: blockedReason, blocked: true };
      }
      try {
        storage.setItem(STORAGE_KEY, raw);
        return { ok: true, raw, error: null, blocked: false };
      } catch (error) {
        return { ok: false, raw: expectedRaw ?? null, error: storageError(error, 'Saving'), blocked: false };
      }
    },
  };
}

export function serializeBackup(workspace) {
  const backup = {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: validateWorkspace(workspace),
  };
  // Compact JSON keeps the backup limit consistent with data size near capacity.
  const result = JSON.stringify(backup);
  if (jsonByteLength(result) > LIMITS.payloadBytes) {
    throw new ValidationError('Backup exceeds the 2 MiB limit. Use a smaller workspace.');
  }
  return result;
}

export function parseBackup(text) {
  const backup = parseJson(text, 'Backup');
  const keys = ['format', 'schemaVersion', 'exportedAt', 'workspace'];
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)
    || Object.keys(backup).length !== keys.length || !keys.every(key => Object.hasOwn(backup, key))) {
    throw new ValidationError('Backup has missing or unsupported fields.');
  }
  if (backup.format !== BACKUP_FORMAT || ![1, 2, SCHEMA_VERSION].includes(backup.schemaVersion)) {
    throw new ValidationError('Unsupported backup format or schema version. This app supports StepTrace backup versions 1, 2, and 3.');
  }
  if (backup.workspace?.schemaVersion !== backup.schemaVersion) {
    throw new ValidationError('Backup envelope and workspace schema versions must agree.');
  }
  if (typeof backup.exportedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(backup.exportedAt)
    || !Number.isFinite(Date.parse(backup.exportedAt)) || new Date(backup.exportedAt).toISOString() !== backup.exportedAt) {
    throw new ValidationError('Backup export time must be a valid UTC timestamp, including milliseconds.');
  }
  return migrateWorkspace(backup.workspace);
}

export function mergeWorkspaces(current, incoming) {
  const existing = validateWorkspace(current);
  const restored = validateWorkspace(incoming);
  // Global ID validation rejects whole or partial collisions. Never remap exact
  // references, deduplicate silently, or overwrite a current application.
  return validateWorkspace({ schemaVersion: SCHEMA_VERSION,
    applications: [...existing.applications, ...restored.applications] });
}
