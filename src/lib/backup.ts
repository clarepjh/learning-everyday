import { isArray, isBoolean, isPlainObject, isString, uniq } from "lodash-es";
import { DEFAULT_SUBJECT_COLOR, isSubjectColor } from "./subjectColors";
import type { Note, StudyLog, Subject } from "./learningData";

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_RECORDS_PER_TABLE = 10_000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type BackupSubject = Omit<Subject, "user_id">;
export type BackupNote = Omit<Note, "user_id">;
export type BackupStudyLog = Omit<StudyLog, "user_id">;

export interface LearningBackup {
  schemaVersion: 1;
  exportedAt: string;
  subjects: BackupSubject[];
  notes: BackupNote[];
  studyLogs: BackupStudyLog[];
}

export interface BackupImportResult {
  subjectsInserted: number;
  subjectsSkipped: number;
  notesInserted: number;
  notesSkipped: number;
  studyLogsInserted: number;
  studyLogsSkipped: number;
}

export function createLearningBackup(
  subjects: Subject[],
  notes: Note[],
  studyLogs: StudyLog[],
  exportedAt = new Date().toISOString(),
): LearningBackup {
  return {
    schemaVersion: 1,
    exportedAt,
    subjects: subjects.map(({ user_id: _owner, ...subject }) => subject),
    notes: notes.map(({ user_id: _owner, ...note }) => note),
    studyLogs: studyLogs.map(({ user_id: _owner, ...log }) => log),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function validDate(value: unknown): value is string {
  if (!isString(value) || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validTimestamp(value: unknown): value is string {
  return (
    isString(value) &&
    value.length <= 40 &&
    !Number.isNaN(Date.parse(value))
  );
}

function validId(value: unknown): value is string {
  return isString(value) && uuidPattern.test(value);
}

function validateRows<T>(
  value: unknown,
  allowedKeys: readonly string[],
  validate: (row: Record<string, unknown>) => boolean,
): value is T[] {
  return (
    isArray(value) &&
    value.length <= MAX_RECORDS_PER_TABLE &&
    value.every(
      (row) =>
        isRecord(row) &&
        hasOnlyKeys(row, allowedKeys) &&
        validate(row),
    )
  );
}

const subjectKeys = ["id", "name", "color", "created_at", "updated_at"] as const;
const noteKeys = [
  "id",
  "subject_id",
  "title",
  "topic",
  "content_md",
  "mistakes_md",
  "learned_on",
  "needs_revision",
  "tags",
  "created_at",
  "updated_at",
] as const;
const studyLogKeys = [
  "id",
  "entry_date",
  "summary_md",
  "note_id",
  "created_at",
  "updated_at",
] as const;

export function parseLearningBackup(
  text: string,
): LearningBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error("Backup exceeds the 10 MB size limit.");
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Backup must contain valid JSON.");
  }
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "schemaVersion",
      "exportedAt",
      "subjects",
      "notes",
      "studyLogs",
    ]) ||
    value.schemaVersion !== 1 ||
    !validTimestamp(value.exportedAt)
  ) {
    throw new Error("Backup header is invalid or its schema version is unsupported.");
  }

  const subjectsValid = validateRows<BackupSubject>(
    value.subjects,
    subjectKeys,
    (row) =>
      validId(row.id) &&
      isString(row.name) &&
      row.name.trim().length > 0 &&
      row.name.length <= 120 &&
      (row.color === undefined || isSubjectColor(row.color)) &&
      validTimestamp(row.created_at) &&
      validTimestamp(row.updated_at),
  );
  const notesValid = validateRows<BackupNote>(
    value.notes,
    noteKeys,
    (row) =>
      validId(row.id) &&
      validId(row.subject_id) &&
      isString(row.title) &&
      row.title.trim().length > 0 &&
      row.title.length <= 200 &&
      isString(row.topic) &&
      row.topic.length <= 200 &&
      isString(row.content_md) &&
      row.content_md.length <= 1_000_000 &&
      (row.mistakes_md === null ||
        (isString(row.mistakes_md) &&
          row.mistakes_md.length <= 1_000_000)) &&
      validDate(row.learned_on) &&
      isBoolean(row.needs_revision) &&
      isArray(row.tags) &&
      row.tags.length <= 100 &&
      row.tags.every((tag) => isString(tag) && tag.length <= 100) &&
      validTimestamp(row.created_at) &&
      validTimestamp(row.updated_at),
  );
  const logsValid = validateRows<BackupStudyLog>(
    value.studyLogs,
    studyLogKeys,
    (row) =>
      validId(row.id) &&
      validDate(row.entry_date) &&
      isString(row.summary_md) &&
      row.summary_md.trim().length > 0 &&
      row.summary_md.length <= 50_000 &&
      (row.note_id === null || validId(row.note_id)) &&
      validTimestamp(row.created_at) &&
      validTimestamp(row.updated_at),
  );

  if (!subjectsValid || !notesValid || !logsValid) {
    throw new Error(
      "Backup data is invalid. No records have been imported; check the file and try again.",
    );
  }

  const backup: LearningBackup = {
    schemaVersion: 1,
    exportedAt: value.exportedAt,
    subjects: (value.subjects as Omit<BackupSubject, "color">[]).map((subject) => ({
      ...subject,
      color: "color" in subject && isSubjectColor(subject.color)
        ? subject.color
        : DEFAULT_SUBJECT_COLOR,
    })),
    notes: value.notes as BackupNote[],
    studyLogs: value.studyLogs as BackupStudyLog[],
  };
  const hasDuplicateIds = (ids: string[]) => uniq(ids).length !== ids.length;
  if (
    hasDuplicateIds(backup.subjects.map(({ id }) => id)) ||
    hasDuplicateIds(backup.notes.map(({ id }) => id)) ||
    hasDuplicateIds(backup.studyLogs.map(({ id }) => id))
  ) {
    throw new Error("Backup contains duplicate record IDs. No records were imported.");
  }

  const subjectIds = new Set(backup.subjects.map(({ id }) => id));
  const noteIds = new Set(backup.notes.map(({ id }) => id));
  if (
    backup.notes.some(({ subject_id }) => !subjectIds.has(subject_id)) ||
    backup.studyLogs.some(
      ({ note_id }) => note_id !== null && !noteIds.has(note_id),
    )
  ) {
    throw new Error(
      "Backup contains unresolved subject or note references. No records were imported.",
    );
  }

  return backup;
}

export function serializeLearningBackup(backup: LearningBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}
