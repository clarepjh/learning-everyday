import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import { some } from "lodash-es";
import { useAuth } from "./auth/AuthProvider";
import { BackupPreviewDialog } from "./components/backup/BackupPreviewDialog";
import { DeleteDialog } from "./components/DeleteDialog";
import { LearningShell } from "./components/layout/LearningShell";
import { NoteDialog } from "./components/notes/NoteDialog";
import { NoteFilters } from "./components/notes/NoteFilters";
import { NotesView } from "./components/notes/NotesView";
import { StudyLogDialog } from "./components/studyLog/StudyLogDialog";
import { StudyLogView } from "./components/studyLog/StudyLogView";
import { emptySubjectDraft, SubjectDialog, type SubjectDraft } from "./components/subjects/SubjectDialog";
import { SubjectsView } from "./components/subjects/SubjectsView";
import {
  createSubject,
  deleteNote,
  deleteStudyLog,
  deleteSubject,
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
import { loadLearningData } from "./lib/helpers/loadLearningData";
import {
  createLearningBackup,
  MAX_BACKUP_BYTES,
  parseLearningBackup,
  serializeLearningBackup,
  type LearningBackup,
} from "./lib/backup";
import { messageOf } from "./helpers/actionError";
import { emptyLog, emptyNote, logToDraft, noteToDraft } from "./helpers/drafts";
import { readDocumentText } from "./helpers/importDocument";
import { today } from "./helpers/localDate";
import { downloadNotesAsDoc, printNotesAsPdf } from "./helpers/noteDocuments";
import { filterNotes } from "./helpers/noteFilters";

export function LearningWorkspace() {
  const { session, signOut } = useAuth();
  const [page, setPage] = useState("Today");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noteToast, setNoteToast] = useState({ id: 0, message: "" });
  const [backupPreview, setBackupPreview] = useState<{
    backup: LearningBackup;
    fileName: string;
  } | null>(null);
  const [documentImportName, setDocumentImportName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [revisionFilter, setRevisionFilter] = useState("");
  const activeSubject = some(subjects, { id: subjectFilter })
    ? subjectFilter
    : "";
  const hasNoteFilters = Boolean(search.trim() || activeSubject || revisionFilter);
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteDraft, setNoteDraft] = useState<NoteInput>(() => emptyNote());
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [logDialog, setLogDialog] = useState(false);
  const [logDraft, setLogDraft] = useState<StudyLogInput>(emptyLog);
  const [editingLog, setEditingLog] = useState<StudyLog | null>(null);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft>(emptySubjectDraft);
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
      const data = await loadLearningData();
      setSubjects(data.subjects);
      setNotes(data.notes);
      setLogs(data.studyLogs);
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
      const { subjects, notes, studyLogs } = await loadLearningData();
      const backup = createLearningBackup(
        subjects,
        notes,
        studyLogs,
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

  function exportNotes(format: "pdf" | "doc", exportedNotes: Note[]) {
    setError(null);
    setSuccess(null);
    try {
      if (format === "doc") {
        downloadNotesAsDoc(exportedNotes, subjects);
        setSuccess("Word-compatible .doc file downloaded.");
      } else {
        printNotesAsPdf(exportedNotes, subjects);
        setSuccess("Choose “Save as PDF” in the print dialog to download your notes.");
      }
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  async function selectImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error("Files must be 10 MB or smaller.");
      }
      const extension = file.name.split(".").at(-1)?.toLowerCase();
      if (extension === "json") {
        const backup = parseLearningBackup(await file.text());
        setBackupPreview({ backup, fileName: file.name });
        return;
      }
      if (!subjects.length) {
        throw new Error("Create a subject before importing a document as a note.");
      }

      const content_md = await readDocumentText(file);
      setEditingNote(null);
      setNoteDraft({
        ...emptyNote(subjects[0].id),
        title: file.name.replace(/\.[^.]+$/, "").trim().slice(0, 200) || "Imported notes",
        content_md,
      });
      setDocumentImportName(file.name);
      setNoteDialog(true);
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

  const filteredNotes = useMemo(
    () => filterNotes(notes, {
      page,
      search,
      subjectId: activeSubject,
      revision: revisionFilter,
      date: today(),
    }),
    [notes, page, search, activeSubject, revisionFilter],
  );

  const openNewNote = () => {
    setEditingNote(null);
    setNoteDraft(emptyNote(activeSubject || subjects[0]?.id || ""));
    setNoteDialog(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteDraft(noteToDraft(note));
    setNoteDialog(true);
  };

  function showNoteToast(message: string) {
    setNoteToast((previous) => ({ id: previous.id + 1, message }));
  }

  function dismissNoteToast(id: number) {
    setNoteToast((current) => current.id === id ? { ...current, message: "" } : current);
  }

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
      const importedName = documentImportName;
      setDocumentImportName(null);
      await refresh();
      if (importedName) setSuccess(`Imported ${importedName} as a new note.`);
      showNoteToast(editingNote ? "Note updated." : "Note created.");
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
      if (editingSubject) {
        await renameSubject(editingSubject.id, subjectDraft.name.trim(), subjectDraft.color);
      } else {
        await createSubject(subjectDraft.name.trim(), subjectDraft.color);
      }
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
      if (confirmDelete.kind === "note") showNoteToast("Note deleted.");
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  async function removeSubject(subject: Subject) {
    if (some(notes, { subject_id: subject.id })) return;
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
  };

  return (
    <LearningShell
      page={page}
      email={session?.user.email}
      onPageChange={openPage}
      onExport={() => void exportBackup()}
      onImport={(event) => void selectImportFile(event)}
      onSignOut={() => void signOut().catch((reason) => setError(messageOf(reason)))}
      backupDisabled={loading || saving}
      dialogs={(
        <>
          <NoteDialog
            open={noteDialog}
            editing={Boolean(editingNote)}
            draft={noteDraft}
            subjects={subjects}
            saving={saving}
            importedDocumentName={documentImportName}
            onChange={setNoteDraft}
            onClose={() => {
              setNoteDialog(false);
              setDocumentImportName(null);
            }}
            onSubmit={(event) => void submitNote(event)}
          />
          <StudyLogDialog
            open={logDialog}
            editing={Boolean(editingLog)}
            draft={logDraft}
            notes={notes}
            saving={saving}
            onChange={setLogDraft}
            onClose={() => setLogDialog(false)}
            onSubmit={(event) => void submitLog(event)}
          />
          <SubjectDialog
            open={subjectDialog}
            editing={Boolean(editingSubject)}
            draft={subjectDraft}
            saving={saving}
            onChange={setSubjectDraft}
            onClose={() => setSubjectDialog(false)}
            onSubmit={(event) => void submitSubject(event)}
          />
          <DeleteDialog
            kind={confirmDelete?.kind}
            saving={saving}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => void confirmDeleteItem()}
          />
          <BackupPreviewDialog
            preview={backupPreview}
            saving={saving}
            onClose={() => setBackupPreview(null)}
            onConfirm={() => void importBackup()}
          />
        </>
      )}
    >
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
            setSubjectDraft(emptySubjectDraft());
            setSubjectDialog(true);
          }}
          onEdit={(subject) => {
            setEditingSubject(subject);
            setSubjectDraft({ name: subject.name, color: subject.color });
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
            setLogDraft(logToDraft(log));
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
            <NoteFilters
              search={search}
              subjectId={activeSubject}
              revisionFilter={revisionFilter}
              subjects={subjects}
              showRevision={page !== "Revision list"}
              onSearchChange={setSearch}
              onSubjectChange={setSubjectFilter}
              onRevisionChange={setRevisionFilter}
            />
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
              showNoteToast(
                note.needs_revision ? "Note removed from revision list." : "Note added to revision list.",
              );
            } catch (reason) {
              setError(messageOf(reason));
            }
          }}
          onExportNotes={(format) => exportNotes(format, filteredNotes)}
        />
      )}
      <Snackbar
        key={noteToast.id}
        open={Boolean(noteToast.message)}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") dismissNoteToast(noteToast.id);
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          role="status"
          onClose={() => dismissNoteToast(noteToast.id)}
        >
          {noteToast.message}
        </Alert>
      </Snackbar>
    </LearningShell>
  );
}
