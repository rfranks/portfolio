import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LinkedIn from "@mui/icons-material/LinkedIn";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { PortfolioPanelShell } from "@/components/shared";

type ContactCTAProps = {
  topRail?: ReactNode;
};

export default function ContactCTA({ topRail }: ContactCTAProps) {
  const { contactCTA, summary } = useResumeData();
  return (
    <PortfolioPanelShell
      panelClassName="h-full text-center"
      topRail={topRail}
      contentSx={{
        overflowY: "auto",
        minHeight: 0,
        pt: { xs: 0, sm: 0.25, md: 0.75 },
        pb: { xs: 0.5, sm: 0.75, md: 1.5 },
      }}
      useNegativeTopRailMargins
      useNegativeFooterMargins
      panelSx={{ overflow: "hidden" }}
      footerSx={{
        px: { xs: 1, sm: 1.25, md: 3.5 },
        py: { xs: 0.5, sm: 0.75, md: 1 },
      }}
      footer={
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 1.5, md: 2 }}
          justifyContent="center"
          alignItems="center"
          useFlexGap
          flexWrap={{ xs: "nowrap", sm: "wrap" }}
          className="w-full"
          sx={{
            py: { xs: 0, sm: 0.25, md: 0.5 },
            px: { xs: 0.25, sm: 0.5, md: 0 },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            href={`mailto:${summary.contact.email}`}
            startIcon={<EmailOutlined fontSize="small" />}
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
            sx={{
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "420px", sm: "none" },
              py: { xs: 0.55, sm: 0.65, md: 0.8 },
            }}
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
            sx={{
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "420px", sm: "none" },
              py: { xs: 0.55, sm: 0.65, md: 0.8 },
            }}
          >
            {contactCTA.secondaryLabel}
          </Button>
        </Stack>
      }
    >
      <Box className="mx-auto flex max-w-2xl flex-col items-center gap-4" sx={{ minHeight: 0 }}>
        <Typography color="text.secondary" className="leading-7">
          {contactCTA.body}
        </Typography>
      </Box>
    </PortfolioPanelShell>
  );
}
