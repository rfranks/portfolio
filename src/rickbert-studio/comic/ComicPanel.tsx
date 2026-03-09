import { Group, Rect, Text } from "react-konva";
import type { PanelSpec } from "@/rickbert-studio/models";
import { OfficeBackground } from "@/rickbert-studio/comic/OfficeBackground";
import { CharacterSprite } from "@/rickbert-studio/comic/CharacterSprite";
import { SpeechBubble } from "@/rickbert-studio/comic/SpeechBubble";
import { ThoughtBubble } from "@/rickbert-studio/comic/ThoughtBubble";
import { VideoWindow } from "@/rickbert-studio/comic/VideoWindow";
import { DeskNameplate } from "@/rickbert-studio/comic/DeskNameplate";
import { NameTag } from "@/rickbert-studio/comic/NameTag";
import { DeviceSprite } from "@/rickbert-studio/comic/DeviceSprite";
import { PropSprite } from "@/rickbert-studio/comic/PropSprite";

type PanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ComicPanelProps = {
  panel: PanelSpec;
  rect: PanelRect;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ComicPanel({ panel, rect }: ComicPanelProps) {
  const panelText = `${panel.sceneText} ${panel.props.map((prop) => prop.name).join(" ")}`.toLowerCase();
  const hasRemoteWindow = /remote|bali|video|monitor|window/.test(panelText);
  const hasHanz = /hanz|harold|device/.test(panelText);
  const hasNameplate = /nameplate/.test(panelText);
  const hasNameTag = /name tag|nametag/.test(panelText);

  const nonRemoteCharacters = panel.characters.filter((character) => character.name !== "Alvin" || !hasRemoteWindow);
  const anchors = new Map<string, { x: number; y: number }>();

  const yBase = rect.height * 0.72;
  nonRemoteCharacters.forEach((character, index) => {
    const spacing = rect.width / (nonRemoteCharacters.length + 1);
    const x = spacing * (index + 1);
    anchors.set(character.name, { x, y: yBase - 58 });
  });

  if (hasRemoteWindow || panel.characters.some((character) => character.name === "Alvin" && character.isRemote)) {
    anchors.set("Alvin", { x: rect.width * 0.78, y: rect.height * 0.24 });
  }

  return (
    <Group x={rect.x} y={rect.y}>
      <Rect width={rect.width} height={rect.height} fill="#fff" stroke="#111" strokeWidth={2} cornerRadius={4} />
      <Group x={8} y={8}>
        <OfficeBackground width={rect.width - 16} height={rect.height - 16} />

        <Text x={4} y={4} text={`Panel ${panel.panelNumber}`} fontSize={11} fill="#444" />

        {hasRemoteWindow && (
          <VideoWindow
            x={(rect.width - 16) * 0.62}
            y={(rect.height - 16) * 0.1}
            width={(rect.width - 16) * 0.33}
            height={(rect.height - 16) * 0.35}
            label="Alvin"
            subtitle="Bali"
          >
            <CharacterSprite
              name="Alvin"
              x={(rect.width - 16) * 0.165}
              y={(rect.height - 16) * 0.18}
              scale={0.72}
            />
          </VideoWindow>
        )}

        {nonRemoteCharacters.map((character, index) => {
          const spacing = (rect.width - 16) / (nonRemoteCharacters.length + 1);
          const x = spacing * (index + 1);
          const scenePose =
            character.name === "Rickbert" && /palm-to-face|palm to face|facepalm/.test(panel.sceneText.toLowerCase())
              ? "palmFace"
              : character.pose;

          return (
            <CharacterSprite
              key={`${character.name}-${index}`}
              name={character.name}
              x={x}
              y={(rect.height - 16) * 0.72}
              scale={0.94}
              expression={character.expression}
              pose={scenePose}
            />
          );
        })}

        {hasHanz && <DeviceSprite x={(rect.width - 16) * 0.38} y={(rect.height - 16) * 0.67} label="Hanz" />}

        {hasNameplate && (
          <DeskNameplate
            x={(rect.width - 16) * 0.63}
            y={(rect.height - 16) * 0.74}
            text="MR. BARREL"
          />
        )}

        {hasNameTag && <NameTag x={(rect.width - 16) * 0.12} y={(rect.height - 16) * 0.7} text="RICKBERT" />}

        {panel.props
          .filter(
            (prop) =>
              prop.kind === "prop" &&
              !/hanz|device|nameplate|name tag|remote|window/i.test(prop.name)
          )
          .slice(0, 2)
          .map((prop, index) => (
            <PropSprite
              key={`${prop.name}-${index}`}
              x={(rect.width - 16) * (0.08 + index * 0.2)}
              y={(rect.height - 16) * 0.62}
              label={prop.name}
            />
          ))}

        {panel.dialogue.slice(0, 4).map((line, index) => {
          const anchor = anchors.get(line.speaker) ?? {
            x: (rect.width - 16) * (0.2 + index * 0.2),
            y: (rect.height - 16) * 0.62,
          };
          const maxWidth = (rect.width - 16) * 0.56;
          const bubbleX = clamp(anchor.x - maxWidth * 0.5, 10, rect.width - 16 - maxWidth - 8);
          const bubbleY = 18 + index * 64;

          if (line.isSilent) {
            return <ThoughtBubble key={`${line.raw}-${index}`} text="..." x={bubbleX + 48} y={bubbleY + 30} />;
          }

          return (
            <SpeechBubble
              key={`${line.raw}-${index}`}
              text={`${line.speaker}: ${line.text}`}
              x={bubbleX}
              y={bubbleY}
              maxWidth={maxWidth}
              tailTargetX={anchor.x}
              tailTargetY={anchor.y}
            />
          );
        })}
      </Group>
    </Group>
  );
}
