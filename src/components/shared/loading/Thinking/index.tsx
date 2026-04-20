import "./index.css";

import React from "react";

// MUI components
import CircularProgress from "@mui/material/CircularProgress";
import type { ThinkingProps } from "@/types/components/shared";
export type { ThinkingProps } from "@/types/components/shared";

/**
 * Thinking effect component that displays a text with a CSS animation.
 *
 * @param text - Text to display in the thinking effect. Defaults to "Thinking...".
 * @param showIndicator - Whether to show a {@link CircularProgress} indicator. Defaults to false.
 * @param indicatorProps - Props to customize the {@link CircularProgress} indicator. Defaults to
 * { size: "16px", color: "primary", sx: { m: 1 }, variant: "indeterminate", thickness: 3.6 }.
 * @returns A fragment containing the text and optional indicator.
 */
export const Thinking: React.FC<ThinkingProps> = ({
  text = "Thinking...",
  showIndicator = false,
  indicatorProps = {
    size: "16px",
    color: "primary",
    sx: { m: 1 },
    variant: "indeterminate",
    thickness: 3.6,
  },
}) => {
  return (
    <>
      <div className="thinking-effect" data-text={text}>
        {text}
      </div>
      {showIndicator && (
        <CircularProgress {...indicatorProps} role={"progressbar"} />
      )}
    </>
  );
};
