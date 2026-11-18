import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import type { LearningBackup } from "../../lib/backup";

export function BackupPreviewDialog({ preview, saving, onClose, onConfirm }: {
  preview: { backup: LearningBackup; fileName: string } | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={Boolean(preview)}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
      aria-labelledby="backup-preview-title"
    >
      <DialogTitle id="backup-preview-title">Review backup import</DialogTitle>
      <DialogContent dividers>
        {preview && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              File: {preview.fileName}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${preview.backup.subjects.length} subjects`} />
              <Chip label={`${preview.backup.notes.length} notes`} />
              <Chip label={`${preview.backup.studyLogs.length} study logs`} />
            </Stack>
            <Alert severity="warning">
              Existing records with matching IDs will be skipped. All new records
              are imported in one transaction; if any record fails, none are added.
              Backups may contain private notes—only import a file you trust.
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? "Importing…" : "Import backup"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
