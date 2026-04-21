import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { useResumeData } from "@/providers/ResumeDataProvider";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { ListItemAvatar } from "@mui/material";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

export default function Education() {
  const { education } = useResumeData();
  return (
    <PortfolioPanel
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          position: "sticky",
          top: (theme) => `-${theme.spacing(2)}`,
          zIndex: 4,
          mx: -2,
          mt: -2,
          px: 3.5,
          py: 1,
          mb: 0,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(8px)",
          borderTopLeftRadius: "var(--fabric-radius-xl)",
          borderTopRightRadius: "var(--fabric-radius-xl)",
        }}
      >
        Education
      </Typography>
      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflowY: "auto", pt: 1, pb: 0.5 }}>
        <List
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            py: 0,
          }}
        >
          {education.map((edu, index) => (
            <ListItem
              key={`${edu.school}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/5 transition-all duration-200 ease-out dark:bg-white/[0.03] hover:-translate-y-0.5 hover:bg-white/10 dark:hover:bg-white/[0.06]"
              sx={{
                alignItems: "flex-start",
                px: { xs: 1.25, sm: 1.5 },
                py: { xs: 1.25, sm: 1.5 },
              }}
            >
              <ListItemAvatar sx={{ minWidth: { xs: 56, sm: 64 }, pt: 0.25 }}>
                {edu.schoolUrl ? (
                  <Link
                    href={edu.schoolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    aria-label={`Open ${edu.school}`}
                    sx={{ display: "inline-flex", borderRadius: 1 }}
                  >
                    <Image
                      src={withBasePath(edu.image)}
                      alt={edu.school}
                      height={48}
                      width={48}
                    />
                  </Link>
                ) : (
                  <Image
                    src={withBasePath(edu.image)}
                    alt={edu.school}
                    height={48}
                    width={48}
                  />
                )}
              </ListItemAvatar>
              <ListItemText
                sx={{
                  my: 0,
                  "& .MuiListItemText-primary": {
                    display: "block",
                    mb: 0.45,
                    lineHeight: 1.3,
                  },
                  "& .MuiListItemText-secondary": {
                    display: "block",
                    lineHeight: 1.45,
                  },
                }}
                primary={
                  edu.schoolUrl ? (
                    <Link
                      href={edu.schoolUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      color="inherit"
                      sx={{ fontWeight: 600 }}
                    >
                      {edu.school}
                    </Link>
                  ) : (
                    edu.school
                  )
                }
                secondary={
                  <Box
                    component="span"
                    sx={{ display: "flex", flexDirection: "column", gap: 0.45 }}
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {edu.degree} • {edu.year}
                    </Typography>
                    {edu.awards && edu.awards.length > 0 && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: "block", fontStyle: "italic" }}
                      >
                        Awards: {edu.awards.join(", ")}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </PortfolioPanel>
  );
}
