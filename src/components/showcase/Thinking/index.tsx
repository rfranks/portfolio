import "./index.css";

import React from "react";

// MUI components
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";

export interface ThinkingProps {
  /** The text to display in the thinking effect. Default is "Thinking..." */
  text?: string;
  /** Flag indicating whether or not to include a {@link CircularProgress} indicator. Default is false */
  showIndicator?: boolean;
  /** The color of the {@link CircularProgress} indicator.
   * Default color is "primary".
   * Default size is "16px".
   * Default margin is "1" (1px).
   * Default sx is { m: 1 }.
   * Default variant is "indeterminate".
   * Default thickness is 3.6.
   * You can also pass other props to customize the {@link CircularProgress} component.
   * @see {@link CircularProgressProps} for more details.
   * @see {@link CircularProgress} for more details.
   */
  indicatorProps?: CircularProgressProps;
}

/**
 * Thinking effect component that displays a text with a CSS animation.
 *
 * @param text - The text to display in the thinking effect.
 * @returns A div element with the thinking effect applied.
 */
export const Thinking: React.FC<ThinkingProps> = ({
  text = "Thinking...",
  showIndicator = false,
  indicatorProps = {
    size: "16px",
    color: "primary",
    sx: { m: 1 },
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
