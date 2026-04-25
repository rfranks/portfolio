import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type UseDiagramExportsParams = {
  diagramCode: string;
  diagramRef: RefObject<HTMLElement | null>;
  resolvedId: string;
  title?: string;
};

export function useDiagramExports({
  diagramCode,
  diagramRef,
  resolvedId,
  title,
}: UseDiagramExportsParams) {
  const [copySucceeded, setCopySucceeded] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const getExportFileBaseName = useCallback(() => {
    const preferred = (title?.trim() || resolvedId || "diagram").toLowerCase();
    const normalized = preferred
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return normalized || "diagram";
  }, [resolvedId, title]);

  const resolveSvgSize = useCallback((svgElement: SVGSVGElement) => {
    const viewBox = svgElement.viewBox?.baseVal;
    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
      return {
        width: Math.max(1, Math.round(viewBox.width)),
        height: Math.max(1, Math.round(viewBox.height)),
      };
    }

    const widthAttr = Number.parseFloat(svgElement.getAttribute("width") || "");
    const heightAttr = Number.parseFloat(svgElement.getAttribute("height") || "");
    if (
      Number.isFinite(widthAttr) &&
      widthAttr > 0 &&
      Number.isFinite(heightAttr) &&
      heightAttr > 0
    ) {
      return {
        width: Math.max(1, Math.round(widthAttr)),
        height: Math.max(1, Math.round(heightAttr)),
      };
    }

    const rect = svgElement.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || 1)),
      height: Math.max(1, Math.round(rect.height || 1)),
    };
  }, []);

  const getRenderedSvg = useCallback(() => {
    return (diagramRef.current?.querySelector("svg") as SVGSVGElement | null) ?? null;
  }, [diagramRef]);

  const getSerializedSvg = useCallback(() => {
    const svgElement = getRenderedSvg();
    if (!svgElement) {
      return null;
    }

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    const { width: resolvedWidth, height: resolvedHeight } = resolveSvgSize(svgElement);
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    if (!clone.getAttribute("xmlns:xlink")) {
      clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${resolvedWidth} ${resolvedHeight}`);
    }
    clone.setAttribute("width", `${resolvedWidth}`);
    clone.setAttribute("height", `${resolvedHeight}`);

    return {
      svgText: new XMLSerializer().serializeToString(clone),
      width: resolvedWidth,
      height: resolvedHeight,
    };
  }, [getRenderedSvg, resolveSvgSize]);

  const triggerBlobDownload = useCallback((blob: Blob, fileName: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, []);

  const loadImageFromSource = useCallback((source: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const exportImage = new window.Image();
      exportImage.decoding = "async";
      exportImage.onload = () => resolve(exportImage);
      exportImage.onerror = () => reject(new Error("Unable to render SVG for PNG export."));
      exportImage.src = source;
    });
  }, []);

  const canvasToPngBlob = useCallback((canvas: HTMLCanvasElement) => {
    return new Promise<Blob | null>((resolve) => {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          try {
            const dataUrl = canvas.toDataURL("image/png");
            const dataUrlParts = dataUrl.split(",", 2);
            if (dataUrlParts.length < 2) {
              resolve(null);
              return;
            }
            const binary = window.atob(dataUrlParts[1]);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
              bytes[index] = binary.charCodeAt(index);
            }
            resolve(new Blob([bytes], { type: "image/png" }));
          } catch {
            resolve(null);
          }
        }, "image/png");
        return;
      }

      try {
        const dataUrl = canvas.toDataURL("image/png");
        const dataUrlParts = dataUrl.split(",", 2);
        if (dataUrlParts.length < 2) {
          resolve(null);
          return;
        }
        const binary = window.atob(dataUrlParts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        resolve(new Blob([bytes], { type: "image/png" }));
      } catch {
        resolve(null);
      }
    });
  }, []);

  const createRasterSafeSvgText = useCallback((svgText: string) => {
    try {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(svgText, "image/svg+xml");
      if (parsed.querySelector("parsererror")) {
        return null;
      }
      const svgRoot = parsed.documentElement;
      if (!svgRoot || svgRoot.nodeName.toLowerCase() !== "svg") {
        return null;
      }
      const foreignObjects = Array.from(svgRoot.querySelectorAll("foreignObject"));
      if (foreignObjects.length === 0) {
        return null;
      }

      foreignObjects.forEach((foreignObject) => {
        const label = foreignObject.textContent?.replace(/\s+/g, " ").trim() || "";
        const foreignHeight = Number.parseFloat(foreignObject.getAttribute("height") || "");
        const textY = Number.isFinite(foreignHeight) && foreignHeight > 0 ? foreignHeight / 2 : 12;
        const replacement = parsed.createElementNS("http://www.w3.org/2000/svg", "text");
        replacement.setAttribute("x", "0");
        replacement.setAttribute("y", `${textY}`);
        replacement.setAttribute("fill", "#111111");
        replacement.setAttribute("font-size", "12");
        replacement.setAttribute("dominant-baseline", "middle");
        replacement.textContent = label;
        foreignObject.replaceWith(replacement);
      });

      return new XMLSerializer().serializeToString(svgRoot);
    } catch {
      return null;
    }
  }, []);

  const handleCopyDiagramCode = useCallback(async () => {
    const textToCopy = diagramCode.trim();
    if (!textToCopy) {
      return;
    }

    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        fallbackCopy();
      }
      setCopySucceeded(true);
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopySucceeded(false);
        copyResetTimeoutRef.current = null;
      }, 1400);
    } catch {
      // no-op: if clipboard copy fails, keep icon state unchanged
    }
  }, [diagramCode]);

  const handleExportSvg = useCallback(() => {
    const serialized = getSerializedSvg();
    if (!serialized) {
      return;
    }

    const svgBlob = new Blob([serialized.svgText], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(svgBlob, `${getExportFileBaseName()}.svg`);
  }, [getExportFileBaseName, getSerializedSvg, triggerBlobDownload]);

  const handleExportPng = useCallback(async () => {
    const serialized = getSerializedSvg();
    if (!serialized) {
      return;
    }

    const { svgText, width, height } = serialized;
    const svgCandidateTexts = [svgText];
    const rasterSafeSvgText = createRasterSafeSvgText(svgText);
    if (rasterSafeSvgText && rasterSafeSvgText !== svgText) {
      svgCandidateTexts.push(rasterSafeSvgText);
    }
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

    for (const candidateSvgText of svgCandidateTexts) {
      const candidateBlob = new Blob([candidateSvgText], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = window.URL.createObjectURL(candidateBlob);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(candidateSvgText)}`;
      const imageSources = [blobUrl, dataUrl];

      try {
        for (const imageSource of imageSources) {
          try {
            const exportImage = await loadImageFromSource(imageSource);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(width * pixelRatio));
            canvas.height = Math.max(1, Math.round(height * pixelRatio));
            const context = canvas.getContext("2d");
            if (!context) {
              continue;
            }

            context.scale(pixelRatio, pixelRatio);
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(exportImage, 0, 0, width, height);

            const pngBlob = await canvasToPngBlob(canvas);
            if (!pngBlob) {
              continue;
            }

            triggerBlobDownload(pngBlob, `${getExportFileBaseName()}.png`);
            return;
          } catch {
            // Try the next source candidate.
          }
        }
      } finally {
        window.URL.revokeObjectURL(blobUrl);
      }
    }

    console.warn("PNG export failed after rasterization fallback attempts.");
  }, [
    canvasToPngBlob,
    createRasterSafeSvgText,
    getExportFileBaseName,
    getSerializedSvg,
    loadImageFromSource,
    triggerBlobDownload,
  ]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    copySucceeded,
    handleCopyDiagramCode,
    handleExportSvg,
    handleExportPng,
  };
}
