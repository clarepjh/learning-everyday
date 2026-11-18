import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import type { ChangeEvent } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import MarkdownEditor, { MarkdownPreview } from "./components/MarkdownEditor";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./auth/LoginPage";
import {
  createSubject,
  deleteNote,
  deleteStudyLog,
  deleteSubject,
  listNotes,
  listStudyLogs,
  listSubjects,
  renameSubject,
  restoreLearningBackup,
  saveNote,
  saveStudyLog,
  type Note,
  type NoteInput,
  type StudyLog,
  type StudyLogInput,
  type Subject,
} from "./lib/learningData";
import {
  createLearningBackup,
  MAX_BACKUP_BYTES,
  parseLearningBackup,
  serializeLearningBackup,
  type LearningBackup,
} from "./lib/backup";
import { getErrorMessage, getSafeErrorDiagnostics } from "./lib/errorMessage";

const drawerWidth = 248;
const navigation = [
  { label: "Today", icon: <HomeOutlinedIcon /> },
  { label: "All notes", icon: <AutoStoriesOutlinedIcon /> },
  { label: "Revision list", icon: <CheckCircleOutlineRoundedIcon /> },
  { label: "Study log", icon: <CalendarMonthOutlinedIcon /> },
  { label: "Subjects", icon: <SubjectOutlinedIcon /> },
];

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const emptyNote = (subjectId = ""): NoteInput => ({
  subject_id: subjectId,
  title: "",
  topic: "",
  content_md: "",
  mistakes_md: "",
  learned_on: today(),
  needs_revision: false,
  tags: [],
});
const emptyLog = (): StudyLogInput => ({
  entry_date: today(),
  summary_md: "",
  note_id: null,
});

function messageOf(error: unknown) {
  const message = getErrorMessage(error);
  if (message) return message;
  console.error("Learning Everyday action failed without a readable message.", {
    error: getSafeErrorDiagnostics(error),
  });
  return "The operation failed without a readable error message. See browser console for safe diagnostics.";
}

function LoginShell() {
  return <LoginPage />;
}

function DataApp() {
  const { session, signOut } = useAuth();
  const [page, setPage] = useState("Today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backupPreview, setBackupPreview] = useState<{
    backup: LearningBackup;
    fileName: string;
  } | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [revisionFilter, setRevisionFilter] = useState("");
  const activeSubject = subjects.some((subject) => subject.id === subjectFilter)
    ? subjectFilter
    : "";
  const hasNoteFilters = Boolean(search.trim() || activeSubject || revisionFilter);
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteDraft, setNoteDraft] = useState<NoteInput>(emptyNote());
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [logDialog, setLogDialog] = useState(false);
  const [logDraft, setLogDraft] = useState<StudyLogInput>(emptyLog());
  const [editingLog, setEditingLog] = useState<StudyLog | null>(null);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    | { kind: "note"; value: Note }
    | { kind: "log"; value: StudyLog }
    | { kind: "subject"; value: Subject }
    | null
  >(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [nextSubjects, nextNotes, nextLogs] = await Promise.all([
        listSubjects(),
        listNotes(),
        listStudyLogs(),
      ]);
      setSubjects(nextSubjects);
      setNotes(nextNotes);
      setLogs(nextLogs);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  async function exportBackup() {
    setError(null);
    setSuccess(null);
    try {
      const [currentSubjects, currentNotes, currentLogs] = await Promise.all([
        listSubjects(),
        listNotes(),
        listStudyLogs(),
      ]);
      const backup = createLearningBackup(
        currentSubjects,
        currentNotes,
        currentLogs,
      );
      const blob = new Blob([serializeLearningBackup(backup)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learning-everyday-${today()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess(
        "Backup downloaded. It contains private notes; store the file securely.",
      );
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  async function selectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error("Backup exceeds the 10 MB size limit.");
      }
      const backup = parseLearningBackup(await file.text());
      setBackupPreview({ backup, fileName: file.name });
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  async function importBackup() {
    if (!backupPreview) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await restoreLearningBackup(backupPreview.backup);
      setBackupPreview(null);
      await refresh();
      setSuccess(
        `Backup restored — subjects: ${result.subjectsInserted} added, ${result.subjectsSkipped} skipped; notes: ${result.notesInserted} added, ${result.notesSkipped} skipped; study logs: ${result.studyLogsInserted} added, ${result.studyLogsSkipped} skipped.`,
      );
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const date = today();
    return notes.filter((note) => {
      if (page === "Revision list" && !note.needs_revision) return false;
      if (page === "Today" && note.learned_on !== date) return false;
      if (activeSubject && note.subject_id !== activeSubject) return false;
      if (revisionFilter && note.needs_revision !== (revisionFilter === "marked")) return false;
      if (!query) return true;
      return [note.title, note.topic, note.content_md, note.mistakes_md ?? "", ...note.tags]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [notes, page, search, activeSubject, revisionFilter]);

  const openNewNote = () => {
    setEditingNote(null);
    setNoteDraft(emptyNote(activeSubject || subjects[0]?.id || ""));
    setNoteDialog(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteDraft({
      subject_id: note.subject_id,
      title: note.title,
      topic: note.topic,
      content_md: note.content_md,
      mistakes_md: note.mistakes_md ?? "",
      learned_on: note.learned_on,
      needs_revision: note.needs_revision,
      tags: note.tags,
    });
    setNoteDialog(true);
  };

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveNote(
        { ...noteDraft, title: noteDraft.title.trim(), tags: noteDraft.tags },
        editingNote?.id,
      );
      setNoteDialog(false);
      await refresh();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  async function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveStudyLog(
        { ...logDraft, summary_md: logDraft.summary_md.trim() },
        editingLog?.id,
      );
      setLogDialog(false);
      await refresh();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  async function submitSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingSubject) await renameSubject(editingSubject.id, subjectDraft.trim());
      else await createSubject(subjectDraft.trim());
      setSubjectDialog(false);
      await refresh();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);
    try {
      if (confirmDelete.kind === "note") await deleteNote(confirmDelete.value.id);
      else if (confirmDelete.kind === "log") await deleteStudyLog(confirmDelete.value.id);
      else await deleteSubject(confirmDelete.value.id);
      setConfirmDelete(null);
      await refresh();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  async function removeSubject(subject: Subject) {
    if (notes.some((note) => note.subject_id === subject.id)) return;
    setConfirmDelete({ kind: "subject", value: subject });
  }

  const clearNoteFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setRevisionFilter("");
  };

  const openPage = (nextPage: string) => {
    if (nextPage !== page) clearNoteFilters();
    setPage(nextPage);
    setMobileOpen(false);
  };

  const sidebar = (
    <Box className="sidebar-content">
      <Box className="brand">
        <Box className="brand-mark"><LocalLibraryOutlinedIcon fontSize="small" /></Box>
        <Box>
          <Typography fontWeight={750} lineHeight={1.2}>Learning</Typography>
          <Typography fontWeight={750} lineHeight={1.2}>Everyday</Typography>
        </Box>
      </Box>
      <Divider />
      <List aria-label="Main navigation" sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.label}
            selected={page === item.label}
            onClick={() => openPage(item.label)}
            aria-current={page === item.label ? "page" : undefined}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box className="sidebar-bottom">
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={650} noWrap>
          {session?.user.email}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box className="app-shell">
      <Drawer
        variant="permanent"
        className="desktop-drawer"
        sx={{ display: { xs: "none", md: "block" } }}
        PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box" } }}
      >
        {sidebar}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box" } }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {sidebar}
      </Drawer>
      <Box className="main-column" sx={{ ml: { md: `${drawerWidth}px` } }}>
        <AppBar position="sticky" color="inherit" elevation={0} className="topbar">
          <Toolbar className="topbar-content">
            <IconButton
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" }, mr: 1 }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" className="topbar-title">
              {page}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              color="inherit"
              size="small"
              aria-label="Export backup"
              onClick={() => void exportBackup()}
              startIcon={<CloudDownloadOutlinedIcon />}
              disabled={loading || saving}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Export
              </Box>
            </Button>
            <Button
              color="inherit"
              size="small"
              aria-label="Import backup"
              onClick={() => backupInput.current?.click()}
              startIcon={<CloudUploadOutlinedIcon />}
              disabled={loading || saving}
              sx={{ ml: 0.5 }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Import
              </Box>
            </Button>
            <input
              ref={backupInput}
              hidden
              type="file"
              accept=".json,application/json"
              aria-label="Choose a JSON backup"
              onChange={(event) => void selectBackup(event)}
            />
            <Button
              color="inherit"
              aria-label="Sign out"
              onClick={() => void signOut().catch((reason) => setError(messageOf(reason)))}
              startIcon={<LogoutRoundedIcon />}
              sx={{ ml: 1 }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Sign out
              </Box>
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" className="main-content">
          <Box className="page-content">
            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {loading ? (
              <Box className="center-state"><CircularProgress aria-label="Loading your learning data" /></Box>
            ) : page === "Subjects" ? (
              <SubjectsView
                subjects={subjects}
                notes={notes}
                onCreate={() => {
                  setEditingSubject(null);
                  setSubjectDraft("");
                  setSubjectDialog(true);
                }}
                onEdit={(subject) => {
                  setEditingSubject(subject);
                  setSubjectDraft(subject.name);
                  setSubjectDialog(true);
                }}
                onDelete={(subject) => void removeSubject(subject)}
              />
            ) : page === "Study log" ? (
              <StudyLogView
                logs={logs}
                notes={notes}
                onCreate={() => {
                  setEditingLog(null);
                  setLogDraft(emptyLog());
                  setLogDialog(true);
                }}
                onEdit={(log) => {
                  setEditingLog(log);
                  setLogDraft({
                    entry_date: log.entry_date,
                    summary_md: log.summary_md,
                    note_id: log.note_id,
                  });
                  setLogDialog(true);
                }}
                onDelete={(log) => setConfirmDelete({ kind: "log", value: log })}
              />
            ) : (
              <NotesView
                page={page}
                notes={filteredNotes}
                subjects={subjects}
                filtersActive={hasNoteFilters}
                onClearFilters={clearNoteFilters}
                filters={
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
                      onChange={(event) => setSearch(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      select
                      size="small"
                      label="Filter by subject"
                      value={activeSubject}
                      onChange={(event) => setSubjectFilter(event.target.value)}
                      slotProps={{ select: { native: true } }}
                      fullWidth
                    >
                      <option value="">All subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </TextField>
                    {page !== "Revision list" && (
                      <TextField
                        select
                        size="small"
                        label="Revision status"
                        value={revisionFilter}
                        onChange={(event) => setRevisionFilter(event.target.value)}
                        slotProps={{ select: { native: true } }}
                        fullWidth
                      >
                        <option value="">Any status</option>
                        <option value="marked">Marked for revision</option>
                        <option value="unmarked">Not marked</option>
                      </TextField>
                    )}
                  </Stack>
                }
                onCreate={openNewNote}
                onEdit={openEditNote}
                onDelete={(note) => setConfirmDelete({ kind: "note", value: note })}
                onToggleRevision={async (note) => {
                  try {
                    await saveNote({
                      subject_id: note.subject_id,
                      title: note.title,
                      topic: note.topic,
                      content_md: note.content_md,
                      mistakes_md: note.mistakes_md,
                      learned_on: note.learned_on,
                      needs_revision: !note.needs_revision,
                      tags: note.tags,
                    }, note.id);
                    await refresh();
                  } catch (reason) {
                    setError(messageOf(reason));
                  }
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={noteDialog}
        onClose={() => !saving && setNoteDialog(false)}
        fullWidth
        maxWidth="lg"
        aria-labelledby="note-dialog-title"
      >
        <DialogTitle id="note-dialog-title">{editingNote ? "Edit note" : "New note"}</DialogTitle>
        <Box component="form" onSubmit={(event) => void submitNote(event)}>
          <DialogContent dividers>
            <Stack spacing={2.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Title"
                  required
                  fullWidth
                  inputProps={{ maxLength: 200 }}
                  value={noteDraft.title}
                  onChange={(event) => setNoteDraft({ ...noteDraft, title: event.target.value })}
                />
                <FormControl required fullWidth>
                  <InputLabel id="note-subject-label">Subject</InputLabel>
                  <Select
                    labelId="note-subject-label"
                    label="Subject"
                    value={noteDraft.subject_id}
                    onChange={(event) =>
                      setNoteDraft({ ...noteDraft, subject_id: event.target.value })
                    }
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Topic"
                  fullWidth
                  value={noteDraft.topic}
                  onChange={(event) => setNoteDraft({ ...noteDraft, topic: event.target.value })}
                />
                <TextField
                  label="Date learned"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={noteDraft.learned_on}
                  onChange={(event) =>
                    setNoteDraft({ ...noteDraft, learned_on: event.target.value })
                  }
                />
              </Stack>
              <TextField
                label="Tags"
                helperText="Separate tags with commas."
                value={noteDraft.tags.join(", ")}
                onChange={(event) =>
                  setNoteDraft({
                    ...noteDraft,
                    tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                  })
                }
              />
              <MarkdownEditor
                value={noteDraft.content_md}
                onChange={(content_md) => setNoteDraft({ ...noteDraft, content_md })}
              />
              <TextField
                label="What I got wrong (optional)"
                multiline
                minRows={3}
                value={noteDraft.mistakes_md ?? ""}
                onChange={(event) =>
                  setNoteDraft({ ...noteDraft, mistakes_md: event.target.value })
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={noteDraft.needs_revision}
                    onChange={(event) =>
                      setNoteDraft({ ...noteDraft, needs_revision: event.target.checked })
                    }
                  />
                }
                label="Add to revision list"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setNoteDialog(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !subjects.length}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={logDialog} onClose={() => !saving && setLogDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingLog ? "Edit study log" : "New study log"}</DialogTitle>
        <Box component="form" onSubmit={(event) => void submitLog(event)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Date"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={logDraft.entry_date}
                onChange={(event) => setLogDraft({ ...logDraft, entry_date: event.target.value })}
              />
              <TextField
                label="Reflection"
                required
                multiline
                minRows={5}
                value={logDraft.summary_md}
                onChange={(event) => setLogDraft({ ...logDraft, summary_md: event.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel id="log-note-label">Related note (optional)</InputLabel>
                <Select
                  labelId="log-note-label"
                  label="Related note (optional)"
                  value={logDraft.note_id ?? ""}
                  onChange={(event) =>
                    setLogDraft({ ...logDraft, note_id: event.target.value || null })
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
            <Button onClick={() => setLogDialog(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving…" : "Save reflection"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={subjectDialog} onClose={() => !saving && setSubjectDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingSubject ? "Rename subject" : "New subject"}</DialogTitle>
        <Box component="form" onSubmit={(event) => void submitSubject(event)}>
          <DialogContent>
            <TextField
              autoFocus
              label="Subject name"
              required
              fullWidth
              inputProps={{ maxLength: 120 }}
              value={subjectDraft}
              onChange={(event) => setSubjectDraft(event.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setSubjectDialog(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving…" : "Save subject"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this {confirmDelete?.kind}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {confirmDelete?.kind === "note"
              ? "This note will be deleted. Linked study logs will be kept without the note link."
              : confirmDelete?.kind === "log"
                ? "This study log will be permanently deleted."
                : "This subject will be deleted only if it has no notes."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDeleteItem()} disabled={saving}>
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(backupPreview)}
        onClose={() => !saving && setBackupPreview(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="backup-preview-title"
      >
        <DialogTitle id="backup-preview-title">Review backup import</DialogTitle>
        <DialogContent dividers>
          {backupPreview && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                File: {backupPreview.fileName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${backupPreview.backup.subjects.length} subjects`} />
                <Chip label={`${backupPreview.backup.notes.length} notes`} />
                <Chip label={`${backupPreview.backup.studyLogs.length} study logs`} />
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
          <Button onClick={() => setBackupPreview(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void importBackup()}
            disabled={saving}
          >
            {saving ? "Importing…" : "Import backup"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PageHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action: ReactNode;
}) {
  return (
    <Box className="page-heading">
      <Box>
        <Typography variant="overline" color="text.primary" fontWeight={700}>{eyebrow}</Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{detail}</Typography>
      </Box>
      {action}
    </Box>
  );
}

function NotesView({
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
}) {
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
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onCreate}
            disabled={!subjects.length}
          >
            New note
          </Button>
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
          {notes.map((note) => {
            const subject = subjects.find((item) => item.id === note.subject_id);
            return (
              <Paper key={note.id} variant="outlined" className="note-card">
                <Box className="note-card-heading">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h3">{note.title}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip size="small" label={subject?.name ?? "Subject"} />
                      {note.topic && <Chip size="small" variant="outlined" label={note.topic} />}
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                        {note.learned_on}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
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
                <Box sx={{ mt: 2 }}>
                  <MarkdownPreview value={note.content_md} />
                </Box>
                {note.mistakes_md && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>What I got wrong</Typography>
                    <MarkdownPreview value={note.mistakes_md} />
                  </>
                )}
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

function SubjectsView({
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
                  <Typography fontWeight={650}>{subject.name}</Typography>
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

function StudyLogView({
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
                    Related note: {notes.find((note) => note.id === log.note_id)?.title ?? "Note deleted"}
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

export default function App() {
  const { session, loading } = useAuth();
  if (loading) {
    return <Box className="center-state full-page"><CircularProgress aria-label="Checking your session" /></Box>;
  }
  return session ? <DataApp /> : <LoginShell />;
}
