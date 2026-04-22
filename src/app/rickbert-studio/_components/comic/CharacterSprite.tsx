import { Circle, Group, Line, Rect } from "react-konva";
import { CHARACTER_CONFIGS } from "@/app/rickbert-studio/_domain/characterConfigs";
import { palette } from "@/app/rickbert-studio/_rendering/palette";

type CharacterSpriteProps = {
  name: string;
  x: number;
  y: number;
  scale?: number;
  expression?: string;
  pose?: string;
};

function shirtColor(style: string | undefined): string {
  switch (style) {
    case "blazer":
      return palette.blazer;
    case "zip":
      return palette.zip;
    case "executive":
      return palette.executive;
    default:
      return palette.shirtWhite;
  }
}

export function CharacterSprite({ name, x, y, scale = 1, expression, pose }: CharacterSpriteProps) {
  const config = CHARACTER_CONFIGS[name] ?? CHARACTER_CONFIGS.Rickbert;
  const width = 56 * scale;
  const headRadius = 16 * scale;
  const shirt = shirtColor(config.shirtStyle);
  const usePose = pose ?? config.defaultPose;

  return (
    <Group x={x} y={y}>
      <Rect
        x={-width / 2}
        y={10 * scale}
        width={width}
        height={56 * scale}
        fill={shirt}
        stroke="#111"
        strokeWidth={1.2}
        cornerRadius={10 * scale}
      />
      <Circle
        x={0}
        y={-8 * scale}
        radius={headRadius}
        fill={palette.skin}
        stroke="#111"
        strokeWidth={1.2}
      />

      <Rect
        x={-headRadius}
        y={-22 * scale}
        width={headRadius * 2}
        height={10 * scale}
        fill={config.hairStyle === "long" ? palette.hairDark : palette.hairLight}
        stroke="#111"
        strokeWidth={1}
        cornerRadius={4 * scale}
      />

      {config.hairStyle === "spiky" && (
        <Line
          points={[
            -16 * scale,
            -22 * scale,
            -8 * scale,
            -30 * scale,
            0,
            -22 * scale,
            8 * scale,
            -29 * scale,
            16 * scale,
            -22 * scale,
          ]}
          stroke="#111"
          strokeWidth={1.2}
          closed={false}
        />
      )}

      {config.glasses && (
        <>
          <Circle
            x={-6 * scale}
            y={-8 * scale}
            radius={4.5 * scale}
            stroke="#111"
            strokeWidth={1}
          />
          <Circle x={6 * scale} y={-8 * scale} radius={4.5 * scale} stroke="#111" strokeWidth={1} />
          <Line
            points={[-1.5 * scale, -8 * scale, 1.5 * scale, -8 * scale]}
            stroke="#111"
            strokeWidth={1}
          />
        </>
      )}

      {config.facialHair !== "none" && (
        <Rect
          x={-4.5 * scale}
          y={-1 * scale}
          width={9 * scale}
          height={7 * scale}
          fill="#8b6a58"
          cornerRadius={2 * scale}
        />
      )}

      <Circle x={-5 * scale} y={-9 * scale} radius={1.2 * scale} fill="#111" />
      <Circle x={5 * scale} y={-9 * scale} radius={1.2 * scale} fill="#111" />

      <Line
        points={
          expression === "pleasant"
            ? [-6 * scale, -2 * scale, 0, 1 * scale, 6 * scale, -2 * scale]
            : expression === "focused"
              ? [-6 * scale, 0, 6 * scale, 0]
              : [-5 * scale, 1 * scale, 0, -1 * scale, 5 * scale, 1 * scale]
        }
        stroke="#111"
        strokeWidth={1.2}
        tension={0.5}
      />

      <Line
        points={
          usePose === "armsFolded"
            ? [-24 * scale, 26 * scale, -2 * scale, 24 * scale, 22 * scale, 26 * scale]
            : usePose === "point"
              ? [-24 * scale, 24 * scale, -6 * scale, 18 * scale, 18 * scale, 6 * scale]
              : usePose === "palmFace"
                ? [-24 * scale, 24 * scale, -10 * scale, 14 * scale, 2 * scale, -4 * scale]
                : [-24 * scale, 24 * scale, -10 * scale, 18 * scale, 20 * scale, 24 * scale]
        }
        stroke="#111"
        strokeWidth={2}
        lineCap="round"
      />

      {usePose === "palmFace" && (
        <Circle
          x={3 * scale}
          y={-5 * scale}
          radius={4 * scale}
          fill={palette.skin}
          stroke="#111"
          strokeWidth={1}
        />
      )}
    </Group>
  );
}
