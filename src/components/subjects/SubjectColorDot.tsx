import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import type { SubjectColor } from "../../lib/subjectColors";

export function SubjectColorDot({ color, label }: {
  color: SubjectColor;
  label: string;
}) {
  return (
    <CircleRoundedIcon
      titleAccess={`${label} colour`}
      fontSize="small"
      htmlColor={color}
      sx={{ flexShrink: 0 }}
    />
  );
}
