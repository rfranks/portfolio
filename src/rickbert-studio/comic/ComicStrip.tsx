import type { ComicStripSpec } from "@/rickbert-studio/models";
import { ComicTitle } from "@/rickbert-studio/comic/ComicTitle";
import { ComicPanel } from "@/rickbert-studio/comic/ComicPanel";
import {
  computeStripLayout,
  type RenderSettings,
} from "@/rickbert-studio/rendering/layoutEngine";

type ComicStripProps = {
  spec: ComicStripSpec;
  settings: RenderSettings;
};

export function ComicStrip({ spec, settings }: ComicStripProps) {
  const layout = computeStripLayout(spec, settings);

  return (
    <>
      <ComicTitle width={layout.width} text={spec.title} />
      {layout.panelRects.map((rect) => {
        const panel = spec.panels.find((item) => item.panelNumber === rect.panelNumber);
        if (!panel) {
          return null;
        }
        return <ComicPanel key={panel.panelNumber} panel={panel} rect={rect} />;
      })}
    </>
  );
}
