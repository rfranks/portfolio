import { Layer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import type { RefObject } from "react";
import type { ComicStripSpec } from "@/app/rickbert-studio/_models";
import { ComicStrip } from "@/app/rickbert-studio/_components/comic/ComicStrip";
import type { RenderSettings } from "@/app/rickbert-studio/_rendering/layoutEngine";
import { palette } from "@/app/rickbert-studio/_rendering/palette";

type ComicStageProps = {
  spec: ComicStripSpec;
  settings: RenderSettings;
  stageRef: RefObject<Konva.Stage | null>;
};

export function ComicStage({ spec, settings, stageRef }: ComicStageProps) {
  return (
    <Stage width={settings.stageWidth} height={settings.stageHeight} ref={stageRef}>
      <Layer>
        <Rect
          x={0}
          y={0}
          width={settings.stageWidth}
          height={settings.stageHeight}
          fill={palette.stripBackground}
        />
        <ComicStrip spec={spec} settings={settings} />
      </Layer>
    </Stage>
  );
}
