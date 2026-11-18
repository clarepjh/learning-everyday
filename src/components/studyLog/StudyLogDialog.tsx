import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type { FormEventHandler } from "react";
import type { Note, StudyLogInput } from "../../lib/learningData";

export function StudyLogDialog({ open, editing, saving, draft, notes, onChange, onClose, onSubmit }: {
  open: boolean;
  editing: boolean;
  saving: boolean;
  draft: StudyLogInput;
  notes: Note[];
  onChange: (draft: StudyLogInput) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Edit study log" : "New study log"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Date"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={draft.entry_date}
              onChange={(event) => onChange({ ...draft, entry_date: event.target.value })}
            />
            <TextField
              label="Reflection"
              required
              multiline
              minRows={5}
              value={draft.summary_md}
              onChange={(event) => onChange({ ...draft, summary_md: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel id="log-note-label">Related note (optional)</InputLabel>
              <Select
                labelId="log-note-label"
                label="Related note (optional)"
                value={draft.note_id ?? ""}
                onChange={(event) =>
                  onChange({ ...draft, note_id: event.target.value || null })
                }
              >
                <MenuItem value="">No related note</MenuItem>
                {notes.map((note) => (
                  <MenuItem key={note.id} value={note.id}>{note.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving…" : "Save reflection"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
