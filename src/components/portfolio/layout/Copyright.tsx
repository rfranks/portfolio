import Link from "@mui/material/Link";
import Typography, { TypographyProps } from "@mui/material/Typography";
import { portfolioApps, summary } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";

export type CopyrightProps = TypographyProps & {};

export default function Copyright(props: CopyrightProps) {
  const thisYear = new Date().getFullYear();
  const ownerName = summary.name;
  const siteHref = withBasePath(portfolioApps.site.route);

  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {"Copyright © "}
      <Link color="inherit" href={siteHref}>
        {ownerName}
      </Link>{" "}
      {2024 === thisYear ? `2024` : `2024-${thisYear}`}
      {"."}
    </Typography>
  );
}
