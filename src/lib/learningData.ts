import type {
  Json,
  NoteRow,
  StudyLogRow,
  SubjectRow,
} from "./database.types";
import { supabase } from "./supabase";
import type {
  BackupImportResult,
  LearningBackup,
} from "./backup";

export type Subject = SubjectRow;
export type Note = NoteRow;
export type StudyLog = StudyLogRow;

export type NoteInput = Omit<
  Note,
  "id" | "user_id" | "created_at" | "updated_at"
>;
export type StudyLogInput = Omit<
  StudyLog,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface NoteFilters {
  subjectId?: string;
  needsRevision?: boolean;
}

function client() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check the local Vite environment.");
  }
  return supabase;
}

async function currentUserId(): Promise<string> {
  const { data, error } = await client().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in is required to access learning data.");
  return data.user.id;
}

export async function listSubjects(): Promise<Subject[]> {
  const userId = await currentUserId();
  const { data, error } = await client()
    .from("subjects")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createSubject(name: string): Promise<Subject> {
  const userId = await currentUserId();
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("Subject name cannot be blank.");

  const { data, error } = await client()
    .from("subjects")
    .insert({ user_id: userId, name: normalizedName })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function renameSubject(
  id: string,
  name: string,
): Promise<Subject> {
  const userId = await currentUserId();
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("Subject name cannot be blank.");

  const { data, error } = await client()
    .from("subjects")
    .update({ name: normalizedName })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await client()
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listNotes(
  filters: NoteFilters = {},
): Promise<Note[]> {
  const userId = await currentUserId();
  let query = client()
    .from("notes")
    .select("*")
    .eq("user_id", userId);
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters.needsRevision !== undefined) {
    query = query.eq("needs_revision", filters.needsRevision);
  }
  const { data, error } = await query
    .order("learned_on", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveNote(
  input: NoteInput,
  id?: string,
): Promise<Note | null> {
  const userId = await currentUserId();
  const query = client().from("notes");
  if (id) {
    const { data, error } = await query
      .update(input)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await query
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await client()
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listStudyLogs(): Promise<StudyLog[]> {
  const userId = await currentUserId();
  const { data, error } = await client()
    .from("study_logs")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveStudyLog(
  input: StudyLogInput,
  id?: string,
): Promise<StudyLog | null> {
  const userId = await currentUserId();
  const query = client().from("study_logs");
  if (id) {
    const { data, error } = await query
      .update(input)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await query
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStudyLog(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await client()
    .from("study_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

function isBackupImportResult(value: Json): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return [
    "subjectsInserted",
    "subjectsSkipped",
    "notesInserted",
    "notesSkipped",
    "studyLogsInserted",
    "studyLogsSkipped",
  ].every(
    (key) =>
      typeof value[key] === "number" &&
      Number.isInteger(value[key]) &&
      value[key] >= 0,
  );
}

export async function restoreLearningBackup(
  backup: LearningBackup,
): Promise<BackupImportResult> {
  await currentUserId();
  const { data, error } = await client().rpc("import_learning_backup", {
    payload: backup as unknown as Json,
  });
  if (error) throw error;
  if (!data || !isBackupImportResult(data)) {
    throw new Error("Backup restore returned an invalid result.");
  }
  return data as unknown as BackupImportResult;
}
