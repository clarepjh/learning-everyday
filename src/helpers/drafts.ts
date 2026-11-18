import type { Note, NoteInput, StudyLog, StudyLogInput } from "../lib/learningData";
import { today } from "./localDate";

export function emptyNote(subjectId = ""): NoteInput {
  return {
    subject_id: subjectId,
    title: "",
    topic: "",
    content_md: "",
    mistakes_md: "",
    learned_on: today(),
    needs_revision: false,
    tags: [],
  };
}

export function noteToDraft(note: Note): NoteInput {
  return {
    subject_id: note.subject_id,
    title: note.title,
    topic: note.topic,
    content_md: note.content_md,
    mistakes_md: note.mistakes_md ?? "",
    learned_on: note.learned_on,
    needs_revision: note.needs_revision,
    tags: note.tags,
  };
}

export function emptyLog(): StudyLogInput {
  return { entry_date: today(), summary_md: "", note_id: null };
}

export function logToDraft(log: StudyLog): StudyLogInput {
  return {
    entry_date: log.entry_date,
    summary_md: log.summary_md,
    note_id: log.note_id,
  };
}
