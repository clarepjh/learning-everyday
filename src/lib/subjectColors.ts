export const SUBJECT_COLORS = [
  { name: "Violet", value: "#7C5CE7" },
  { name: "Blue", value: "#3283D4" },
  { name: "Teal", value: "#1F9D8B" },
  { name: "Green", value: "#5B9B50" },
  { name: "Amber", value: "#D99A2B" },
  { name: "Coral", value: "#E16B57" },
  { name: "Pink", value: "#D84C85" },
  { name: "Slate", value: "#64748B" },
] as const;

export type SubjectColor = (typeof SUBJECT_COLORS)[number]["value"];

export const DEFAULT_SUBJECT_COLOR: SubjectColor = SUBJECT_COLORS[0].value;

export function isSubjectColor(value: unknown): value is SubjectColor {
  return SUBJECT_COLORS.some((color) => color.value === value);
}
