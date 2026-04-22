import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import PanelFrame, { type PanelFrameProps } from "./PanelFrame";

type PortfolioPanelShellProps = PanelFrameProps & {
  panelClassName?: string;
  panelSx?: SxProps<Theme>;
};

const toSxArray = (value?: SxProps<Theme>) => (Array.isArray(value) ? value : value ? [value] : []);

export default function PortfolioPanelShell({
  panelClassName,
  panelSx,
  children,
  ...frameProps
}: PortfolioPanelShellProps) {
  return (
    <PortfolioPanel
      className={panelClassName}
      sx={[
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
        },
        ...toSxArray(panelSx),
      ]}
    >
      <PanelFrame
        rootSx={{
          minHeight: 0,
          height: "100%",
          flex: "1 1 auto",
          overflow: "visible",
        }}
        {...frameProps}
      >
        {children}
      </PanelFrame>
    </PortfolioPanel>
  );
}
