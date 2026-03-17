"use client";

import { ReactNode } from "react";
import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import useInView from "@/hooks/useInView";

interface FadeInSectionProps {
  children: ReactNode;
}

export default function FadeInSection({ children }: FadeInSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0,
    rootMargin: "0px 0px 20% 0px",
  });

  return (
    <Fade in={inView} timeout={600}>
      <Box ref={ref}>{children}</Box>
    </Fade>
  );
}
