import type Konva from "konva";

export function exportStageAsPng(stage: Konva.Stage | null, fileName = "rickbert-strip.png"): void {
  if (!stage) {
    return;
  }

  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}
