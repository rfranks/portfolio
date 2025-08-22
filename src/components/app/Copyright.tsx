import Link from "@mui/material/Link";
import Typography, { TypographyProps } from "@mui/material/Typography";

export type CopyrightProps = TypographyProps & {};

export default function Copyright(props: any) {
  const thisYear = new Date().getFullYear();

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://rfranks.github.io/blasteroids">
        GeneBoard
      </Link>{" "}
      {2024 === thisYear ? `2024` : `2024-${thisYear}`}
      {"."}
    </Typography>
  );
}
