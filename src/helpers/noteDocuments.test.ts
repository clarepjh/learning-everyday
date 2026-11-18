import { describe, expect, it } from "vitest";
import type { Note, Subject } from "../lib/learningData";
import { createNotesDocumentHtml } from "./noteDocuments";
import { DEFAULT_SUBJECT_COLOR } from "../lib/subjectColors";

const subject: Subject = {
  id: "subject-1",
  user_id: "owner",
  name: "<Algorithms>",
  color: DEFAULT_SUBJECT_COLOR,
  created_at: "",
  updated_at: "",
};

const note: Note = {
  id: "note-1",
  user_id: "owner",
  subject_id: subject.id,
  title: "Binary <search>",
  topic: "Arrays & trees",
  content_md: "Use <left> and <right>.",
  mistakes_md: null,
  learned_on: "2026-01-01",
  needs_revision: false,
  tags: ["bounds"],
  created_at: "",
  updated_at: "",
};

describe("note document export", () => {
  it("creates a Word-readable document and escapes user-authored content", () => {
    const html = createNotesDocumentHtml([note], [subject]);

    expect(html).toContain("<meta charset=\"utf-8\">");
    expect(html).toContain("<h1>Binary &lt;search&gt;</h1>");
    expect(html).toContain("&lt;Algorithms&gt;");
    expect(html).toContain("Use &lt;left&gt; and &lt;right&gt;.");
    expect(html).not.toContain("<left>");
  });
});
