import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { PageHeading } from "../PageHeading";
import type { Note, StudyLog } from "../../lib/learningData";
import { find } from "lodash-es";
import { MarkdownPreview } from "../MarkdownEditor";

export function StudyLogView({
  logs,
  notes,
  onCreate,
  onEdit,
  onDelete,
}: {
  logs: StudyLog[];
  notes: Note[];
  onCreate: () => void;
  onEdit: (log: StudyLog) => void;
  onDelete: (log: StudyLog) => void;
}) {
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow="DAILY REFLECTIONS"
        title="Study log"
        detail="Notice the small steps that add up."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onCreate}>New reflection</Button>}
      />
      {logs.length ? (
        <Stack spacing={1.5}>
          {logs.map((log) => (
            <Paper key={log.id} variant="outlined" className="list-row study-log-row">
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" color="text.primary">{log.entry_date}</Typography>
                <Box sx={{ mt: 1 }}><MarkdownPreview value={log.summary_md} /></Box>
                {log.note_id && (
                  <Typography variant="caption" color="text.secondary">
                    Related note: {find(notes, { id: log.note_id })?.title ?? "Note deleted"}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton aria-label={`Edit study log ${log.entry_date}`} onClick={() => onEdit(log)}>
                  <EditOutlinedIcon />
                </IconButton>
                <IconButton aria-label={`Delete study log ${log.entry_date}`} onClick={() => onDelete(log)}>
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper variant="outlined" className="empty-state">
          <Box className="empty-state-icon"><CalendarMonthOutlinedIcon color="primary" /></Box>
          <Typography variant="h3" sx={{ mb: 1 }}>Your first reflection starts here</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>A sentence is enough to record a day of learning.</Typography>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onCreate}>Add a reflection</Button>
        </Paper>
      )}
    </Stack>
  );
}
