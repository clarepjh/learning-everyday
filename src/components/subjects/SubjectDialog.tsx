import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import type { FormEventHandler } from "react";
import { DEFAULT_SUBJECT_COLOR, isSubjectColor, SUBJECT_COLORS } from "../../lib/subjectColors";
import type { SubjectColor } from "../../lib/subjectColors";
import { SubjectColorDot } from "./SubjectColorDot";

export interface SubjectDraft {
  name: string;
  color: SubjectColor;
}

export const emptySubjectDraft = (): SubjectDraft => ({
  name: "",
  color: DEFAULT_SUBJECT_COLOR,
});

export function SubjectDialog({ open, editing, saving, draft, onChange, onClose, onSubmit }: {
  open: boolean;
  editing: boolean;
  saving: boolean;
  draft: SubjectDraft;
  onChange: (draft: SubjectDraft) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>{editing ? "Rename subject" : "New subject"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            label="Subject name"
            required
            fullWidth
            inputProps={{ maxLength: 120 }}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
          <FormControl sx={{ mt: 2 }}>
            <FormLabel id="subject-color-label">Subject colour</FormLabel>
            <RadioGroup
              row
              aria-labelledby="subject-color-label"
              name="subject-color"
              value={draft.color}
              onChange={(event) => {
                if (isSubjectColor(event.target.value)) {
                  onChange({ ...draft, color: event.target.value });
                }
              }}
            >
              {SUBJECT_COLORS.map((color) => (
                <FormControlLabel
                  key={color.value}
                  value={color.value}
                  control={<Radio sx={{ color: color.value, "&.Mui-checked": { color: color.value } }} />}
                  label={(
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <SubjectColorDot color={color.value} label={color.name} />
                      <Typography variant="body2">{color.name}</Typography>
                    </Stack>
                  )}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving…" : "Save subject"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
