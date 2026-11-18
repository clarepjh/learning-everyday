import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type { FormEventHandler } from "react";
import type { NoteInput, Subject } from "../../lib/learningData";
import MarkdownEditor from "../MarkdownEditor";
import { SubjectColorDot } from "../subjects/SubjectColorDot";

export function NoteDialog({
  open,
  editing,
  saving,
  draft,
  importedDocumentName,
  subjects,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  saving: boolean;
  draft: NoteInput;
  importedDocumentName?: string | null;
  subjects: Subject[];
  onChange: (draft: NoteInput) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="lg"
      aria-labelledby="note-dialog-title"
    >
      <DialogTitle id="note-dialog-title">{editing ? "Edit note" : "New note"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.25}>
            {importedDocumentName && (
              <Alert severity="info">
                Content from {importedDocumentName} is ready to review. Choose a subject and
                save the note when it looks right.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Title"
                required
                fullWidth
                inputProps={{ maxLength: 200 }}
                value={draft.title}
                onChange={(event) => onChange({ ...draft, title: event.target.value })}
              />
              <FormControl required fullWidth>
                <InputLabel id="note-subject-label">Subject</InputLabel>
                <Select
                  labelId="note-subject-label"
                  label="Subject"
                  value={draft.subject_id}
                  onChange={(event) =>
                    onChange({ ...draft, subject_id: event.target.value })
                  }
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SubjectColorDot color={subject.color} label={subject.name} />
                        {subject.name}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Topic"
                fullWidth
                value={draft.topic}
                onChange={(event) => onChange({ ...draft, topic: event.target.value })}
              />
              <TextField
                label="Date learned"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={draft.learned_on}
                onChange={(event) =>
                  onChange({ ...draft, learned_on: event.target.value })
                }
              />
            </Stack>
            <TextField
              label="Tags"
              helperText="Separate tags with commas."
              value={draft.tags.join(", ")}
              onChange={(event) =>
                onChange({
                  ...draft,
                  tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                })
              }
            />
            <MarkdownEditor
              value={draft.content_md}
              onChange={(content_md) => onChange({ ...draft, content_md })}
            />
            <TextField
              label="What I got wrong (optional)"
              multiline
              minRows={3}
              value={draft.mistakes_md ?? ""}
              onChange={(event) =>
                onChange({ ...draft, mistakes_md: event.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.needs_revision}
                  onChange={(event) =>
                    onChange({ ...draft, needs_revision: event.target.checked })
                  }
                />
              }
              label="Add to revision list"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || !subjects.length}>
            {saving ? "Saving…" : "Save note"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
