import { Group, Rect, Text } from "react-konva";

type DeskNameplateProps = {
  x: number;
  y: number;
  text: string;
};

export function DeskNameplate({ x, y, text }: DeskNameplateProps) {
  return (
    <Group x={x} y={y}>
      <Rect
        width={104}
        height={22}
        fill="#dfc58f"
        stroke="#111"
        strokeWidth={1.2}
        cornerRadius={4}
      />
      <Text
        x={6}
        y={5}
        width={92}
        align="center"
        text={text}
        fontSize={11}
        fontStyle="bold"
        fill="#111"
      />
    </Group>
  );
}
