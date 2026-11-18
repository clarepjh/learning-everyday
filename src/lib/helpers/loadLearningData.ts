import {
  listNotes,
  listStudyLogs,
  listSubjects,
  type Note,
  type StudyLog,
  type Subject,
} from "../learningData";

export interface LearningDataSnapshot {
  subjects: Subject[];
  notes: Note[];
  studyLogs: StudyLog[];
}

export async function loadLearningData(): Promise<LearningDataSnapshot> {
  const [subjects, notes, studyLogs] = await Promise.all([
    listSubjects(),
    listNotes(),
    listStudyLogs(),
  ]);
  return { subjects, notes, studyLogs };
}
