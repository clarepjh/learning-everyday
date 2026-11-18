import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

export function DeleteDialog({ kind, saving, onClose, onConfirm }: {
  kind?: "note" | "log" | "subject";
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(kind)} onClose={onClose}>
      <DialogTitle>Delete this {kind}?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          {kind === "note"
            ? "This note will be deleted. Linked study logs will be kept without the note link."
            : kind === "log"
              ? "This study log will be permanently deleted."
              : "This subject will be deleted only if it has no notes."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={saving}>
          {saving ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
