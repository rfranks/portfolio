import { Layer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import type { RefObject } from "react";
import type { ComicStripSpec } from "@/rickbert-studio/models";
import { ComicStrip } from "@/rickbert-studio/comic/ComicStrip";
import type { RenderSettings } from "@/rickbert-studio/rendering/layoutEngine";
import { palette } from "@/rickbert-studio/rendering/palette";

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
