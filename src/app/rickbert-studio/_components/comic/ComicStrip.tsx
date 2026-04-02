import type { ComicStripSpec } from "@/app/rickbert-studio/_models";
import { ComicTitle } from "@/app/rickbert-studio/_components/comic/ComicTitle";
import { ComicPanel } from "@/app/rickbert-studio/_components/comic/ComicPanel";
import {
  computeStripLayout,
  type RenderSettings,
} from "@/app/rickbert-studio/_rendering/layoutEngine";

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
