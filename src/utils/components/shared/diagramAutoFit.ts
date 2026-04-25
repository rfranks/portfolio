import { DEFAULT_DIAGRAM_AUTO_FIT } from "@/consts/components/shared/diagramAutoFit";
import type { PanZoomViewportAutoFitAlign } from "@/types/hooks/panZoomViewport";

type DiagramAutoFitConfig = {
  padding: number;
  scaleMultiplier: number;
  offsetX: number;
  offsetY: number;
  verticalAlign: PanZoomViewportAutoFitAlign;
};

type DiagramAutoFitSource = {
  autoFit?: {
    padding?: number;
    scaleMultiplier?: number;
    verticalAlign?: PanZoomViewportAutoFitAlign;
    offsetX?: number;
    offsetY?: number;
  };
  autoFitPadding?: number;
  autoFitScaleMultiplier?: number;
  autoFitVerticalAlign?: PanZoomViewportAutoFitAlign;
  autoFitOffsetX?: number;
  autoFitOffsetY?: number;
};

const resolveNumber = (value: number | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveVerticalAlign = (
  value: PanZoomViewportAutoFitAlign | undefined,
): PanZoomViewportAutoFitAlign =>
  value === "center" || value === "top" ? value : DEFAULT_DIAGRAM_AUTO_FIT.verticalAlign;

export function resolveDiagramAutoFitConfig(
  source: DiagramAutoFitSource | undefined,
): DiagramAutoFitConfig {
  const autoFit = source?.autoFit;
  return {
    padding: resolveNumber(
      autoFit?.padding ?? source?.autoFitPadding,
      DEFAULT_DIAGRAM_AUTO_FIT.padding,
    ),
    scaleMultiplier: resolveNumber(
      autoFit?.scaleMultiplier ?? source?.autoFitScaleMultiplier,
      DEFAULT_DIAGRAM_AUTO_FIT.scaleMultiplier,
    ),
    verticalAlign: resolveVerticalAlign(autoFit?.verticalAlign ?? source?.autoFitVerticalAlign),
    offsetX: resolveNumber(
      autoFit?.offsetX ?? source?.autoFitOffsetX,
      DEFAULT_DIAGRAM_AUTO_FIT.offsetX,
    ),
    offsetY: resolveNumber(
      autoFit?.offsetY ?? source?.autoFitOffsetY,
      DEFAULT_DIAGRAM_AUTO_FIT.offsetY,
    ),
  };
}
