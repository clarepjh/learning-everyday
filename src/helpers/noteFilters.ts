import type { Note } from "../lib/learningData";

type NoteFilters = {
  page: string;
  search: string;
  subjectId: string;
  revision: string;
  date: string;
};

export function filterNotes(
  notes: readonly Note[],
  { page, search, subjectId, revision, date }: NoteFilters,
): Note[] {
  const query = search.trim().toLocaleLowerCase();
  return notes.filter((note) => {
    if (page === "Revision list" && !note.needs_revision) return false;
    if (page === "Today" && note.learned_on !== date) return false;
    if (subjectId && note.subject_id !== subjectId) return false;
    if (revision && note.needs_revision !== (revision === "marked")) return false;
    if (!query) return true;
    return [note.title, note.topic, note.content_md, note.mistakes_md ?? "", ...note.tags]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });
}
