import { Group, Rect, Text } from "react-konva";
import { palette } from "@/app/rickbert-studio/_rendering/palette";

type NameTagProps = {
  x: number;
  y: number;
  text: string;
};

export function NameTag({ x, y, text }: NameTagProps) {
  return (
    <Group x={x} y={y}>
      <Rect width={72} height={18} fill={palette.label} stroke="#111" strokeWidth={1} cornerRadius={3} />
      <Text x={4} y={4} width={64} align="center" text={text} fontSize={10} fill="#111" fontStyle="bold" />
    </Group>
  );
}
