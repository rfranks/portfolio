import { Circle, Group, Rect, Text } from "react-konva";

type DeviceSpriteProps = {
  x: number;
  y: number;
  label?: string;
};

export function DeviceSprite({ x, y, label = "Hanz" }: DeviceSpriteProps) {
  return (
    <Group x={x} y={y}>
      <Rect
        width={58}
        height={42}
        fill="#cfd7dd"
        stroke="#111"
        strokeWidth={1.3}
        cornerRadius={6}
      />
      <Rect
        x={6}
        y={6}
        width={46}
        height={13}
        fill="#f8fbff"
        stroke="#111"
        strokeWidth={1}
        cornerRadius={2}
      />
      <Text x={8} y={8} width={42} align="center" fontSize={10} text={label} fill="#111" />
      <Circle x={29} y={31} radius={4} fill="#56cc8a" stroke="#111" strokeWidth={1} />
    </Group>
  );
}
