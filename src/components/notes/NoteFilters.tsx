import { Stack, TextField } from "@mui/material";
import type { Subject } from "../../lib/learningData";

export function NoteFilters({ search, subjectId, revisionFilter, subjects, showRevision, onSearchChange, onSubjectChange, onRevisionChange }: {
  search: string;
  subjectId: string;
  revisionFilter: string;
  subjects: Subject[];
  showRevision: boolean;
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onRevisionChange: (value: string) => void;
}) {
  return (
    <Stack
      role="search"
      aria-label="Find notes"
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
    >
      <TextField
        type="search"
        size="small"
        label="Search notes"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        fullWidth
      />
      <TextField
        select
        size="small"
        label="Filter by subject"
        value={subjectId}
        onChange={(event) => onSubjectChange(event.target.value)}
        slotProps={{ inputLabel: { shrink: true }, select: { native: true } }}
        fullWidth
      >
        <option value="">All subjects</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>{subject.name}</option>
        ))}
      </TextField>
      {showRevision && (
        <TextField
          select
          size="small"
          label="Revision status"
          value={revisionFilter}
          onChange={(event) => onRevisionChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true }, select: { native: true } }}
          fullWidth
        >
          <option value="">Any status</option>
          <option value="marked">Marked for revision</option>
          <option value="unmarked">Not marked</option>
        </TextField>
      )}
    </Stack>
  );
}
