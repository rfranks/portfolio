import * as React from "react";
import Typography from "@mui/material/Typography";
import type { TitleProps } from "@/types/components/shared";

export default function Title(props: TitleProps) {
  const { children, sx } = props;

  return (
    <Typography component="h2" variant="h6" color="primary" gutterBottom sx={sx}>
      {children}
    </Typography>
  );
}
