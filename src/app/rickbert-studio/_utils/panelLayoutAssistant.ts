import type { ComicStripSpec, PanelSpec } from "@/app/rickbert-studio/_models";

type BubbleRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PanelLayoutAssistantFinding = {
  type: "reading-order" | "bubble-collision" | "snap-suggestion";
  panelNumber?: number;
  message: string;
};

export type PanelLayoutAssistantReport = {
  score: number;
  findings: PanelLayoutAssistantFinding[];
  collisionCount: number;
  suggestionCount: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const estimateBubbleRects = (panel: PanelSpec): BubbleRect[] => {
  const panelWidth = 560;
  const maxWidth = panelWidth * 0.56;
  return panel.dialogue.slice(0, 4).map((line, index) => {
    const text = `${line.speaker}: ${line.text}`;
    const lineChars = Math.max(18, Math.floor(maxWidth / 9));
    const lines = Math.max(1, Math.ceil(text.length / lineChars));
    const textWidth = Math.min(maxWidth - 20, Math.max(80, Math.min(text.length, lineChars) * 7.1));
    const bubbleWidth = textWidth + 20;
    const bubbleHeight = lines * 18 + 18;
    const bubbleX = clamp(
      panelWidth * 0.2 + index * 34 - maxWidth * 0.35,
      10,
      panelWidth - maxWidth - 8,
    );
    const bubbleY = 18 + index * 64;
    return {
      id: `${panel.panelNumber}-${index}`,
      x: bubbleX,
      y: bubbleY,
      width: bubbleWidth,
      height: bubbleHeight,
    };
  });
};

const intersects = (left: BubbleRect, right: BubbleRect): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

export function analyzePanelLayout(spec: ComicStripSpec): PanelLayoutAssistantReport {
  const findings: PanelLayoutAssistantFinding[] = [];
  const panelNumbers = spec.panels.map((panel) => panel.panelNumber);
  const uniquePanelNumbers = new Set(panelNumbers);

  if (uniquePanelNumbers.size !== panelNumbers.length) {
    findings.push({
      type: "reading-order",
      message: "Duplicate panel numbers detected. Ensure a single linear reading order.",
    });
  }

  for (let index = 1; index < panelNumbers.length; index += 1) {
    if (panelNumbers[index] <= panelNumbers[index - 1]) {
      findings.push({
        type: "reading-order",
        panelNumber: panelNumbers[index],
        message: `Panel ${panelNumbers[index]} breaks ascending reading order.`,
      });
    }
  }

  let collisionCount = 0;
  let suggestionCount = 0;

  for (const panel of spec.panels) {
    const bubbleRects = estimateBubbleRects(panel);
    for (let i = 0; i < bubbleRects.length; i += 1) {
      for (let j = i + 1; j < bubbleRects.length; j += 1) {
        const left = bubbleRects[i];
        const right = bubbleRects[j];
        if (intersects(left, right)) {
          collisionCount += 1;
          findings.push({
            type: "bubble-collision",
            panelNumber: panel.panelNumber,
            message: `Speech bubbles ${left.id} and ${right.id} overlap. Increase vertical spacing or reduce text width.`,
          });
        } else {
          const leftEdgeDelta = Math.abs(left.x - right.x);
          if (leftEdgeDelta > 0 && leftEdgeDelta < 16) {
            suggestionCount += 1;
            findings.push({
              type: "snap-suggestion",
              panelNumber: panel.panelNumber,
              message: `Speech bubbles ${left.id} and ${right.id} are near-aligned. Snap to a shared left edge for cleaner scanning.`,
            });
          }
        }
      }
    }
  }

  const score = Math.max(
    0,
    100 - findings.filter((finding) => finding.type !== "snap-suggestion").length * 12,
  );

  return {
    score,
    findings,
    collisionCount,
    suggestionCount,
  };
}
