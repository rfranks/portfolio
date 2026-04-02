import type { ComicStripSpec } from "@/app/rickbert-studio/_models";

export type RenderSettings = {
  stageWidth: number;
  stageHeight: number;
  titleHeight: number;
  outerMargin: number;
  panelGap: number;
  panelPadding: number;
};

export type PanelRect = {
  panelNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StripLayout = {
  width: number;
  height: number;
  contentTop: number;
  panelRects: PanelRect[];
};

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  stageWidth: 1800,
  stageHeight: 1040,
  titleHeight: 84,
  outerMargin: 26,
  panelGap: 18,
  panelPadding: 16,
};

export function computeStripLayout(
  spec: ComicStripSpec,
  settings: RenderSettings = DEFAULT_RENDER_SETTINGS
): StripLayout {
  const rows = spec.layout === "GRID_2X3" ? 2 : 1;
  const columns = 3;

  const contentTop = settings.outerMargin + settings.titleHeight;
  const availableWidth =
    settings.stageWidth - settings.outerMargin * 2 - settings.panelGap * (columns - 1);
  const panelWidth = availableWidth / columns;

  const availableHeight =
    settings.stageHeight - contentTop - settings.outerMargin - settings.panelGap * (rows - 1);
  const panelHeight = availableHeight / rows;

  const panelRects: PanelRect[] = [];

  for (let index = 0; index < spec.panelCount; index += 1) {
    const row = Math.floor(index / columns);
    const col = index % columns;
    panelRects.push({
      panelNumber: index + 1,
      x: settings.outerMargin + col * (panelWidth + settings.panelGap),
      y: contentTop + row * (panelHeight + settings.panelGap),
      width: panelWidth,
      height: panelHeight,
    });
  }

  return {
    width: settings.stageWidth,
    height: settings.stageHeight,
    contentTop,
    panelRects,
  };
}
