import { Group, Rect, Text } from "react-konva";
import type { ReactNode } from "react";

type VideoWindowProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  subtitle?: string;
  children?: ReactNode;
};

export function VideoWindow({ x, y, width, height, label, subtitle, children }: VideoWindowProps) {
  return (
    <Group x={x} y={y}>
      <Rect width={width} height={height} fill="#8ec7d6" stroke="#111" strokeWidth={1.6} cornerRadius={6} />
      <Rect x={0} y={height - 24} width={width} height={24} fill="#0f2230" opacity={0.86} cornerRadius={6} />
      <Text x={8} y={height - 20} width={width - 16} text={subtitle ? `${label} — ${subtitle}` : label} fontSize={12} fill="#fff" />
      {children}
    </Group>
  );
}
