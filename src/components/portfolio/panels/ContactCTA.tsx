import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LinkedIn from "@mui/icons-material/LinkedIn";
import { useResumeData } from "@/providers/ResumeDataProvider";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";

type ContactCTAProps = {
  topRail?: ReactNode;
};

export default function ContactCTA({ topRail }: ContactCTAProps) {
  const { contactCTA, summary } = useResumeData();
  return (
    <PortfolioPanel
      className="text-center"
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {topRail ? (
        <Box
          sx={{
            flexShrink: 0,
            mx: -2,
            mt: -2,
            mb: 0,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(8px)",
            borderTopLeftRadius: "var(--fabric-radius-xl)",
            borderTopRightRadius: "var(--fabric-radius-xl)",
          }}
        >
          {topRail}
        </Box>
      ) : null}
      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflowY: "auto", pt: 0.75, pb: 1.5 }}>
        <Box className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Typography color="text.secondary" className="leading-7">
            {contactCTA.body}
          </Typography>
        </Box>
      </Box>
      <Box
        component="footer"
        sx={{
          flexShrink: 0,
          zIndex: 5,
          mt: 0,
          mx: -2,
          mb: -2,
          px: 3.5,
          py: 1,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(8px)",
          borderBottomLeftRadius: "var(--fabric-radius-xl)",
          borderBottomRightRadius: "var(--fabric-radius-xl)",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          useFlexGap
          flexWrap="wrap"
          className="w-full"
        >
          <Button
            variant="contained"
            color="primary"
            href={`mailto:${summary.contact.email}`}
            startIcon={<EmailOutlined fontSize="small" />}
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            {contactCTA.primaryLabel}
          </Button>
          <Button
            variant="contained"
            href={summary.contact.linkedin}
            target="_blank"
            rel="noopener"
            color="primary"
            startIcon={<LinkedIn fontSize="small" />}
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            {contactCTA.secondaryLabel}
          </Button>
        </Stack>
      </Box>
    </PortfolioPanel>
  );
}
