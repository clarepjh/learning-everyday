import { useState } from "react";
import { Alert, Box, Button, Chip, Collapse, Divider, IconButton, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import { PageHeading } from "../PageHeading";
import type { Note, Subject } from "../../lib/learningData";
import { find } from "lodash-es";
import { MarkdownPreview } from "../MarkdownEditor";
import type { ReactNode } from "react";
import { SubjectColorDot } from "../subjects/SubjectColorDot";

export function NotesView({
  page,
  notes,
  subjects,
  filtersActive,
  onClearFilters,
  filters,
  onCreate,
  onEdit,
  onDelete,
  onToggleRevision,
  onExportNotes,
}: {
  page: string;
  notes: Note[];
  subjects: Subject[];
  filtersActive: boolean;
  onClearFilters: () => void;
  filters: ReactNode;
  onCreate: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onToggleRevision: (note: Note) => void;
  onExportNotes: (format: "pdf" | "doc") => void;
}) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(() => new Set());
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const allVisibleExpanded = notes.length > 0 && notes.every(({ id }) => expandedNotes.has(id));

  function toggleVisibleNotes() {
    setExpandedNotes((current) => {
      const collapse = notes.every(({ id }) => current.has(id));
      const next = new Set(current);
      for (const { id } of notes) {
        if (collapse) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  const headings: Record<string, { title: string; detail: string }> = {
    Today: { title: "A little progress, every day.", detail: "Notes you learned today." },
    "All notes": { title: "Your notes", detail: "Search and revisit what you have learned." },
    "Revision list": { title: "Ready for another look?", detail: "Notes you marked for revision." },
  };
  const heading = headings[page] ?? headings.Today;

  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={page === "Today" ? "YOUR LEARNING SPACE" : page.toUpperCase()}
        title={heading.title}
        detail={heading.detail}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={(event) => setExportAnchor(event.currentTarget)}
              disabled={!notes.length}
            >
              Export notes
            </Button>
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={() => setExportAnchor(null)}
            >
              <MenuItem onClick={() => { setExportAnchor(null); onExportNotes("pdf"); }}>
                Save as PDF
              </MenuItem>
              <MenuItem onClick={() => { setExportAnchor(null); onExportNotes("doc"); }}>
                Word document (.doc)
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={onCreate}
              disabled={!subjects.length}
            >
              New note
            </Button>
          </Stack>
        }
      />
      {!subjects.length && (
        <Alert severity="info">Create a subject first to start saving notes.</Alert>
      )}
      {filters}
      {filtersActive && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography role="status">{notes.length} matching {notes.length === 1 ? "note" : "notes"}</Typography>
          <Button onClick={onClearFilters}>Clear filters</Button>
        </Stack>
      )}
      {notes.length ? (
        <Stack spacing={2}>
          <Button
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start" }}
            onClick={toggleVisibleNotes}
          >
            {allVisibleExpanded ? "Collapse all notes" : "Expand all notes"}
          </Button>
          {notes.map((note) => {
            const subject = find(subjects, { id: note.subject_id });
            const expanded = expandedNotes.has(note.id);
            return (
              <Paper key={note.id} variant="outlined" className="note-card">
                <Box className="note-card-heading">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h3">{note.title}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        icon={subject
                          ? <SubjectColorDot color={subject.color} label={subject.name} />
                          : undefined}
                        label={subject?.name ?? "Subject"}
                      />
                      {note.topic && <Chip size="small" variant="outlined" label={note.topic} />}
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                        {note.learned_on}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label={`${expanded ? "Collapse" : "Expand"} note ${note.title}`}
                      aria-expanded={expanded}
                      aria-controls={`note-content-${note.id}`}
                      onClick={() =>
                        setExpandedNotes((current) => {
                          const next = new Set(current);
                          if (next.has(note.id)) next.delete(note.id);
                          else next.add(note.id);
                          return next;
                        })
                      }
                    >
                      <ExpandMoreRoundedIcon
                        sx={{ transform: expanded ? "rotate(180deg)" : "none" }}
                      />
                    </IconButton>
                    <IconButton
                      aria-label={note.needs_revision ? "Remove from revision list" : "Add to revision list"}
                      onClick={() => void onToggleRevision(note)}
                    >
                      <CheckCircleOutlineRoundedIcon color={note.needs_revision ? "primary" : "inherit"} />
                    </IconButton>
                    <IconButton aria-label={`Edit ${note.title}`} onClick={() => onEdit(note)}>
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton aria-label={`Delete ${note.title}`} onClick={() => onDelete(note)}>
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                </Box>
                {note.tags.length > 0 && (
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
                    {note.tags.map((tag) => <Chip key={tag} size="small" variant="outlined" label={tag} />)}
                  </Stack>
                )}
                <Collapse in={expanded} unmountOnExit>
                  <Box id={`note-content-${note.id}`} sx={{ mt: 2 }}>
                    <MarkdownPreview value={note.content_md} />
                  </Box>
                  {note.mistakes_md && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>What I got wrong</Typography>
                      <MarkdownPreview value={note.mistakes_md} />
                    </>
                  )}
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      ) : filtersActive ? (
        <Alert severity="info">No notes match. Try a different search or clear the filters.</Alert>
      ) : (
        <Paper variant="outlined" className="empty-state">
          <Box className="empty-state-icon"><LocalLibraryOutlinedIcon color="primary" /></Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {page === "Revision list" ? "Nothing to revise just yet" : "Start with one thing you learned"}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 430, mb: 2.5 }}>
            {page === "Revision list"
              ? "Mark a note for revision and it will appear here."
              : "Your notes will be private to your signed-in account."}
          </Typography>
          {page !== "Revision list" && subjects.length > 0 && (
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onCreate}>Create a note</Button>
          )}
        </Paper>
      )}
    </Stack>
  );
}
