export type SubjectRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  topic: string;
  content_md: string;
  mistakes_md: string | null;
  learned_on: string;
  needs_revision: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type StudyLogRow = {
  id: string;
  user_id: string;
  entry_date: string;
  summary_md: string;
  note_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SubjectInsert = Pick<SubjectRow, "user_id" | "name"> &
  Partial<Pick<SubjectRow, "id" | "created_at" | "updated_at">>;
export type NoteInsert = Pick<
  NoteRow,
  | "user_id"
  | "subject_id"
  | "title"
  | "topic"
  | "content_md"
  | "mistakes_md"
  | "learned_on"
  | "needs_revision"
  | "tags"
> &
  Partial<Pick<NoteRow, "id" | "created_at" | "updated_at">>;
export type StudyLogInsert = Pick<
  StudyLogRow,
  "user_id" | "entry_date" | "summary_md" | "note_id"
> &
  Partial<Pick<StudyLogRow, "id" | "created_at" | "updated_at">>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Empty = { [_ in never]: never };

export type Database = {
  public: {
    Tables: {
      subjects: Table<SubjectRow, SubjectInsert, Partial<SubjectInsert>>;
      notes: Table<NoteRow, NoteInsert, Partial<NoteInsert>>;
      study_logs: Table<StudyLogRow, StudyLogInsert, Partial<StudyLogInsert>>;
    };
    Views: Empty;
    Functions: {
      import_learning_backup: {
        Args: { payload: Json };
        Returns: Json;
      };
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
};
