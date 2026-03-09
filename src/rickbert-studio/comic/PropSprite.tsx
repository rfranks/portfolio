import { Group, Rect, Text } from "react-konva";

type PropSpriteProps = {
  x: number;
  y: number;
  label: string;
};

export function PropSprite({ x, y, label }: PropSpriteProps) {
  return (
    <Group x={x} y={y}>
      <Rect width={72} height={26} fill="#ebe6db" stroke="#111" strokeWidth={1.2} cornerRadius={4} />
      <Text x={6} y={7} width={60} align="center" text={label} fontSize={11} fill="#111" />
    </Group>
  );
}
