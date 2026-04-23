import React from "react";
import { keyframes, css } from "@emotion/react";
import Box from "@mui/material/Box";
import type { WaveformProps } from "@/types/components/shared/visualization";

// Keyframes for scaling bar heights
const wave = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50%     { transform: scaleY(1); }
`;

// Generate style for each bar with staggered delay
const barStyle = (delay: number) => css`
  width: 4px;
  height: 32px;
  background-color: #3f51b5;
  margin: 0 2px;
  transform-origin: bottom;
  animation: ${wave} 1s infinite ease-in-out;
  animation-delay: ${delay}s;
`;

const barStyleDead = () => css`
  width: 4px;
  height: 32px;
  background-color: #3f51b5;
  margin: 0 2px;
  transform-origin: bottom;
  transform: scaleY(0.3);
`;

/**
 * Waveform visualizer: animates bars when `active` is true.
 */
export function Waveform({ active, barsCount = 20 }: WaveformProps) {
  const bars = Array.from({ length: barsCount }, (_, i) => i);

  return (
    <Box display="flex" alignItems="flex-end" sx={{ height: "32px" }}>
      {bars.map((i) => (
        <Box
          key={i}
          sx={{
            ...(active ? barStyle(i * 0.1) : barStyleDead()),
          }}
        />
      ))}
    </Box>
  );
}
