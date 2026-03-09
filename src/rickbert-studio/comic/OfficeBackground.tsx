import { Group, Rect } from "react-konva";
import { palette } from "@/rickbert-studio/rendering/palette";

type OfficeBackgroundProps = {
  width: number;
  height: number;
};

export function OfficeBackground({ width, height }: OfficeBackgroundProps) {
  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill={palette.panelFill} />
      <Rect x={0} y={0} width={width} height={height * 0.58} fill={palette.officeWall} opacity={0.85} />
      <Rect x={0} y={height * 0.58} width={width} height={height * 0.42} fill="#e7d8c0" />
      <Rect x={10} y={height * 0.62} width={width - 20} height={12} fill={palette.desk} cornerRadius={4} />
      <Rect x={width * 0.65} y={height * 0.32} width={width * 0.2} height={height * 0.16} fill={palette.monitor} stroke="#111" strokeWidth={1} />
      <Rect x={width * 0.72} y={height * 0.48} width={width * 0.05} height={height * 0.06} fill="#90a2a1" />
    </Group>
  );
}
