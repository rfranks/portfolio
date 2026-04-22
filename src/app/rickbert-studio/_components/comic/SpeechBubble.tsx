import { Group, Line, Rect, Text } from "react-konva";
import { wrapText } from "@/app/rickbert-studio/_utils/text";
import { palette } from "@/app/rickbert-studio/_rendering/palette";

type SpeechBubbleProps = {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  tailTargetX: number;
  tailTargetY: number;
};

export function SpeechBubble({
  text,
  x,
  y,
  maxWidth,
  tailTargetX,
  tailTargetY,
}: SpeechBubbleProps) {
  const lineChars = Math.max(18, Math.floor(maxWidth / 9));
  const lines = wrapText(text, lineChars);
  const textValue = lines.join("\n");
  const textWidth = Math.min(
    maxWidth - 20,
    Math.max(80, Math.max(...lines.map((line) => line.length)) * 7.1),
  );
  const lineHeight = 18;
  const bubbleWidth = textWidth + 20;
  const bubbleHeight = lines.length * lineHeight + 18;
  const tailStartX = x + bubbleWidth * 0.45;
  const tailStartY = y + bubbleHeight;

  return (
    <Group>
      <Rect
        x={x}
        y={y}
        width={bubbleWidth}
        height={bubbleHeight}
        fill={palette.speechFill}
        stroke={palette.speechStroke}
        strokeWidth={1.5}
        cornerRadius={14}
      />
      <Text
        x={x + 10}
        y={y + 8}
        width={bubbleWidth - 20}
        text={textValue}
        fontSize={16}
        lineHeight={1.15}
        fill="#111"
        fontFamily="Arial"
      />
      <Line
        points={[tailStartX, tailStartY, tailStartX + 8, tailStartY + 12, tailTargetX, tailTargetY]}
        closed
        fill={palette.speechFill}
        stroke={palette.speechStroke}
        strokeWidth={1.4}
      />
    </Group>
  );
}
