import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function PageHeading({
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
