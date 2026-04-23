"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";

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
const SPECIFICATIONS_REVEAL_BASE_DELAY_MS = 120;
const SPECIFICATIONS_REVEAL_STEP_MS = 110;
const SPECIFICATIONS_REVEAL_SFX_PATH = "/audio/click_004.ogg";
const SPECIFICATIONS_REVEAL_SFX_VOLUME = 0.16;

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
  const revealTimeoutsRef = useRef<number[]>([]);
  const specificationRevealSfxA = useAudio(SPECIFICATIONS_REVEAL_SFX_PATH);
  const specificationRevealSfxB = useAudio(SPECIFICATIONS_REVEAL_SFX_PATH);
  const specificationRevealSfxC = useAudio(SPECIFICATIONS_REVEAL_SFX_PATH);
  const specificationRevealSfxD = useAudio(SPECIFICATIONS_REVEAL_SFX_PATH);
  const specificationRevealSfxPool = useMemo(
    () => [
      specificationRevealSfxA,
      specificationRevealSfxB,
      specificationRevealSfxC,
      specificationRevealSfxD,
    ],
    [
      specificationRevealSfxA,
      specificationRevealSfxB,
      specificationRevealSfxC,
      specificationRevealSfxD,
    ],
  );

  const clearRevealTimeouts = () => {
    if (revealTimeoutsRef.current.length === 0) {
      return;
    }
    for (const timeoutId of revealTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    revealTimeoutsRef.current = [];
  };

  useEffect(() => {
    clearRevealTimeouts();
    setRevealActive(false);
    const frameId = window.requestAnimationFrame(() => setRevealActive(true));
    return () => {
      window.cancelAnimationFrame(frameId);
      clearRevealTimeouts();
    };
  }, [specifications]);

  useEffect(() => {
    if (
      !revealActive ||
      specificationEntries.length === 0 ||
      specificationRevealSfxPool.length === 0
    ) {
      return;
    }

    clearRevealTimeouts();
    for (let index = 0; index < specificationEntries.length; index += 1) {
      const delay = SPECIFICATIONS_REVEAL_BASE_DELAY_MS + index * SPECIFICATIONS_REVEAL_STEP_MS;
      const timeoutId = window.setTimeout(() => {
        const sfxRef = specificationRevealSfxPool[index % specificationRevealSfxPool.length];
        rewindAndPlayAudio(sfxRef, { volume: SPECIFICATIONS_REVEAL_SFX_VOLUME });
      }, delay);
      revealTimeoutsRef.current.push(timeoutId);
    }

    return () => {
      clearRevealTimeouts();
    };
  }, [revealActive, specificationEntries.length, specificationRevealSfxPool]);

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
            animationDelay: revealActive
              ? `${SPECIFICATIONS_REVEAL_BASE_DELAY_MS + index * SPECIFICATIONS_REVEAL_STEP_MS}ms`
              : "0ms",
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
        px: { xs: 0, sm: 0, md: 2 },
        py: { xs: 0, sm: 0, md: 2 },
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
