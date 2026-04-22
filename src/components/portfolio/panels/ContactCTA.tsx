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
      panelClassName="text-center"
      topRail={topRail}
      contentSx={{ overflowY: "auto", pt: 0.75, pb: 1.5 }}
      useNegativeTopRailMargins
      useNegativeFooterMargins
      panelSx={{ overflow: "hidden" }}
      footer={
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
      }
    >
      <Box className="mx-auto flex max-w-2xl flex-col items-center gap-4">
        <Typography color="text.secondary" className="leading-7">
          {contactCTA.body}
        </Typography>
      </Box>
    </PortfolioPanelShell>
  );
}
