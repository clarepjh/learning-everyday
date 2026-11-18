import { describe, expect, it } from "vitest";
import {
  createLearningBackup,
  parseLearningBackup,
  serializeLearningBackup,
} from "./backup";
import type { Note, StudyLog, Subject } from "./learningData";

const subject: Subject = {
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "owner-id",
  name: "Algorithms",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};
const note: Note = {
  id: "00000000-0000-4000-8000-000000000002",
  user_id: "owner-id",
  subject_id: subject.id,
  title: "Binary search",
  topic: "Search",
  content_md: "Keep the interval sorted.",
  mistakes_md: null,
  learned_on: "2026-01-01",
  needs_revision: false,
  tags: ["arrays"],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};
const studyLog: StudyLog = {
  id: "00000000-0000-4000-8000-000000000003",
  user_id: "owner-id",
  entry_date: "2026-01-01",
  summary_md: "Practiced binary search.",
  note_id: note.id,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};
const backup = createLearningBackup(
  [subject],
  [note],
  [studyLog],
  "2026-01-02T00:00:00.000Z",
);

describe("learning backup", () => {
  it("exports versioned learning data without owner IDs and parses it", () => {
    const serialized = serializeLearningBackup(backup);
    expect(serialized).not.toContain("user_id");
    expect(serialized).not.toContain("owner-id");
    expect(parseLearningBackup(serialized)).toEqual(backup);
  });

  it("rejects malformed or unsupported backup data", () => {
    expect(() => parseLearningBackup("{")).toThrow("valid JSON");
    expect(() =>
      parseLearningBackup(JSON.stringify({ ...backup, schemaVersion: 2 })),
    ).toThrow("schema version");
  });

  it("rejects owner IDs and unresolved foreign references", () => {
    expect(() =>
      parseLearningBackup(
        JSON.stringify({
          ...backup,
          subjects: [{ ...backup.subjects[0], user_id: "another-user" }],
        }),
      ),
    ).toThrow("Backup data is invalid");

    expect(() =>
      parseLearningBackup(
        JSON.stringify({
          ...backup,
          notes: [{ ...backup.notes[0], subject_id: "00000000-0000-4000-8000-000000000004" }],
        }),
      ),
    ).toThrow("unresolved");
  });

  it("rejects repeated IDs within a table", () => {
    expect(() =>
      parseLearningBackup(
        JSON.stringify({ ...backup, notes: [backup.notes[0], backup.notes[0]] }),
      ),
    ).toThrow("duplicate record IDs");
  });
});
