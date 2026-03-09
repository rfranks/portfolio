import { Circle, Group, Text } from "react-konva";

type ThoughtBubbleProps = {
  text: string;
  x: number;
  y: number;
};

export function ThoughtBubble({ text, x, y }: ThoughtBubbleProps) {
  return (
    <Group>
      <Circle x={x} y={y} radius={44} fill="#fff" stroke="#111" strokeWidth={1.5} />
      <Circle x={x - 48} y={y + 28} radius={10} fill="#fff" stroke="#111" strokeWidth={1.4} />
      <Circle x={x - 64} y={y + 42} radius={6} fill="#fff" stroke="#111" strokeWidth={1.2} />
      <Text x={x - 30} y={y - 12} width={60} align="center" text={text} fontSize={14} fill="#111" />
    </Group>
  );
}
