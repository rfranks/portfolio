import type { ComicStripSpec } from "@/app/rickbert-studio/_schemas";

export function downloadComicStripSpecJson(spec: ComicStripSpec): void {
  const blob = new Blob([`${JSON.stringify(spec, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rickbert-spec-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function readComicStripSpecFromFile(file: File): Promise<unknown> {
  const jsonText = await file.text();
  if (!jsonText.trim()) {
    throw new Error("Selected JSON file is empty.");
  }

  return JSON.parse(jsonText) as unknown;
}

export function parsePanelLabelsDraft(labelsDraft: string): string[] {
  return labelsDraft
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
