import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { PageHeading } from "../PageHeading";
import type { Note, Subject } from "../../lib/learningData";
import { SubjectColorDot } from "./SubjectColorDot";

export function SubjectsView({
  subjects,
  notes,
  onCreate,
  onEdit,
  onDelete,
}: {
  subjects: Subject[];
  notes: Note[];
  onCreate: () => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}) {
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow="YOUR LIBRARY"
        title="Subjects"
        detail="Organize notes around what you are learning."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onCreate}>New subject</Button>}
      />
      {subjects.length ? (
        <Stack spacing={1.5}>
          {subjects.map((subject) => {
            const count = notes.filter((note) => note.subject_id === subject.id).length;
            return (
              <Paper key={subject.id} variant="outlined" className="list-row">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SubjectColorDot color={subject.color} label={subject.name} />
                    <Typography fontWeight={650}>{subject.name}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {count} {count === 1 ? "note" : "notes"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton aria-label={`Rename ${subject.name}`} onClick={() => onEdit(subject)}>
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${subject.name}`}
                    disabled={count > 0}
                    title={count > 0 ? "Delete notes in this subject first" : "Delete subject"}
                    onClick={() => onDelete(subject)}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Paper variant="outlined" className="empty-state">
          <Typography variant="h3" sx={{ mb: 1 }}>Add your first subject</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Subjects keep related learning together.</Typography>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onCreate}>Create a subject</Button>
        </Paper>
      )}
    </Stack>
  );
}
