import { NextRequest, NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";

const DOCX_DOCUMENT_PATH = "word/document.xml";
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

const textDecoder = new TextDecoder("utf-8");

function findEndOfCentralDirectory(data: Uint8Array): number {
  const minimumLength = 22;
  for (let i = data.length - minimumLength; i >= 0; i--) {
    if (
      data[i] === (EOCD_SIGNATURE & 0xff) &&
      data[i + 1] === ((EOCD_SIGNATURE >> 8) & 0xff) &&
      data[i + 2] === ((EOCD_SIGNATURE >> 16) & 0xff) &&
      data[i + 3] === ((EOCD_SIGNATURE >> 24) & 0xff)
    ) {
      return i;
    }
  }
  return -1;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeDocxXml(xml: string): string {
  const withBreaks = xml
    .replace(/<w:tab\s*\/>/gi, "\t")
    .replace(/<w:(?:br|cr)[^>]*>/gi, "\n")
    .replace(/<w:p[^>]*>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeXmlEntities(withoutTags);

  const lines = decoded.split(/\r?\n/).map((line) => line.replace(/\t/g, " ").trim());
  const compacted: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (compacted.length > 0 && compacted[compacted.length - 1] === "") {
        continue;
      }
      if (compacted.length > 0) {
        compacted.push("");
      }
      continue;
    }
    compacted.push(line.replace(/\s+/g, " "));
  }

  return compacted.join("\n").trim();
}

function extractDocumentXml(data: Uint8Array): string {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const eocdOffset = findEndOfCentralDirectory(data);
  if (eocdOffset === -1) {
    throw new Error("Invalid DOCX archive: central directory not found");
  }

  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const directoryEnd = centralDirectoryOffset + centralDirectorySize;

  let cursor = centralDirectoryOffset;
  while (cursor < directoryEnd) {
    if (view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid DOCX archive: corrupt central directory");
    }

    const generalPurposeFlag = view.getUint16(cursor + 8, true);
    if (generalPurposeFlag & 0x0001) {
      throw new Error("Encrypted DOCX files are not supported");
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraFieldLength = view.getUint16(cursor + 30, true);
    const fileCommentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const nameStart = cursor + 46;
    const nameEnd = nameStart + fileNameLength;
    const fileName = textDecoder.decode(data.subarray(nameStart, nameEnd));

    if (fileName === DOCX_DOCUMENT_PATH) {
      const localHeaderSignature = view.getUint32(localHeaderOffset, true);
      if (localHeaderSignature !== LOCAL_FILE_HEADER_SIGNATURE) {
        throw new Error("Invalid DOCX archive: corrupt local file header");
      }

      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = data.subarray(dataOffset, dataOffset + compressedSize);

      if (compressionMethod === 0) {
        return textDecoder.decode(compressed);
      }

      if (compressionMethod === 8) {
        const inflated = inflateRawSync(compressed);
        return textDecoder.decode(inflated);
      }

      throw new Error(`Unsupported DOCX compression method: ${compressionMethod}`);
    }

    cursor = nameEnd + extraFieldLength + fileCommentLength;
  }

  throw new Error("DOCX archive does not contain word/document.xml");
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "A DOCX file is required" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const xml = extractDocumentXml(new Uint8Array(arrayBuffer));
    const text = normalizeDocxXml(xml);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse DOCX file";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
