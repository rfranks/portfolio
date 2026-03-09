import { Text } from "react-konva";

type ComicTitleProps = {
  width: number;
  text: string;
};

export function ComicTitle({ width, text }: ComicTitleProps) {
  if (!text.trim()) {
    return null;
  }

  return (
    <Text
      x={0}
      y={20}
      width={width}
      text={text}
      fontSize={42}
      fill="#111"
      align="center"
      fontStyle="bold"
      fontFamily="Arial"
      letterSpacing={2}
    />
  );
}
