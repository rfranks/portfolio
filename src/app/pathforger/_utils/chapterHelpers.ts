function normalizeChapterLine(value: string): string {
  return value
    .replace(/^#{1,6}\s*/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function extractChapterTitle(markdown: string): string {
  const lines = markdown
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
        .replace(/[*_`~]/g, ""),
    )
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (!heading) {
      continue;
    }

    const title = heading[1].trim();

    if (title.length > 0) {
      return title;
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const chapterTitleInline = line.match(/^chapter\s+\d+\s*[—–:-]\s*(.+)$/i);
    if (chapterTitleInline && chapterTitleInline[1].trim().length > 0) {
      return line;
    }

    const chapterLabelOnly = line.match(/^chapter\s+\d+$/i);
    if (chapterLabelOnly) {
      const nextLine = lines[index + 1]?.trim() ?? "";
      if (nextLine.length > 0 && !/^chapter\s+\d+/i.test(nextLine) && nextLine.length <= 120) {
        return `${line} — ${nextLine}`;
      }
      return line;
    }
  }

  const firstLine = lines[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 120) {
    return firstLine;
  }

  return "Untitled Chapter";
}

export function stripLeadingDuplicateChapterHeadings(params: {
  markdown: string;
  subtitle: string;
  chapterNumber?: number;
}): string {
  const lines = params.markdown.split("\n");
  const subtitleNorm = normalizeChapterLine(params.subtitle);
  const chapterLabelNorm =
    typeof params.chapterNumber === "number"
      ? normalizeChapterLine(`Chapter ${params.chapterNumber}`)
      : "";

  let index = 0;
  let checks = 0;
  while (index < lines.length && checks < 6) {
    const raw = lines[index];
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      index += 1;
      checks += 1;
      continue;
    }

    const lineNorm = normalizeChapterLine(trimmed);
    const matchesSubtitle = subtitleNorm.length > 0 && lineNorm === subtitleNorm;
    const matchesChapterLabel =
      chapterLabelNorm.length > 0 &&
      (lineNorm === chapterLabelNorm || lineNorm.startsWith(`${chapterLabelNorm} `));

    if (matchesSubtitle || matchesChapterLabel) {
      lines.splice(index, 1);
      checks += 1;
      continue;
    }

    break;
  }

  return lines.join("\n").replace(/^\s*\n/, "");
}
