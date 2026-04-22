"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import { DemoSlide, MarkdownContent } from "@/components/shared";

type SpecificationsSectionProps = {
  specifications: Record<string, unknown>;
  useSharedDemoSlide: boolean;
};

const specificationsStackedReveal = keyframes`
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
    filter: blur(0.7px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

const renderSpecification = (value: unknown): ReactNode => {
  if (Array.isArray(value)) {
    return (
      <List dense>
        {value.map((item, index) => (
          <ListItem key={index}>{renderSpecification(item)}</ListItem>
        ))}
      </List>
    );
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => (
      <Accordion key={childKey} sx={{ backgroundColor: "transparent" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">{childKey}</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderSpecification(childValue)}</AccordionDetails>
      </Accordion>
    ));
  }

  return <MarkdownContent content={String(value)} sx={{ "& p": { mb: 0 } }} />;
};

export default function SpecificationsSection({
  specifications,
  useSharedDemoSlide,
}: SpecificationsSectionProps) {
  const [revealActive, setRevealActive] = useState(false);
  const specificationEntries = useMemo(() => Object.entries(specifications), [specifications]);

  useEffect(() => {
    setRevealActive(false);
    const frameId = window.requestAnimationFrame(() => setRevealActive(true));
    return () => window.cancelAnimationFrame(frameId);
  }, [specifications]);

  const content = (
    <Box sx={{ minHeight: 0, overflow: "hidden" }}>
      {specificationEntries.map(([key, value], index) => (
        <Box
          key={key}
          sx={{
            opacity: revealActive ? 1 : 0,
            animation: revealActive
              ? `${specificationsStackedReveal} 980ms cubic-bezier(0.22, 1, 0.36, 1) both`
              : "none",
            animationDelay: revealActive ? `${120 + index * 110}ms` : "0ms",
          }}
        >
          <Accordion sx={{ backgroundColor: "transparent", my: 0.5 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{key}</Typography>
            </AccordionSummary>
            <AccordionDetails>{renderSpecification(value)}</AccordionDetails>
          </Accordion>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {useSharedDemoSlide ? (
        <DemoSlide
          title=""
          subtitle=""
          contentSx={{
            minHeight: 0,
            height: "100%",
            overflow: "auto",
          }}
        >
          {content}
        </DemoSlide>
      ) : (
        content
      )}
    </Box>
  );
}
