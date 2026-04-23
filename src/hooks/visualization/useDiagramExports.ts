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
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgBlobUrl = window.URL.createObjectURL(svgBlob);

    try {
      const exportImage = new window.Image();
      await new Promise<void>((resolve, reject) => {
        exportImage.onload = () => resolve();
        exportImage.onerror = () => reject(new Error("Unable to render SVG for PNG export."));
        exportImage.src = svgBlobUrl;
      });

      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.scale(pixelRatio, pixelRatio);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(exportImage, 0, 0, width, height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!pngBlob) {
        return;
      }

      triggerBlobDownload(pngBlob, `${getExportFileBaseName()}.png`);
    } catch {
      // no-op: skip export when SVG rasterization fails.
    } finally {
      window.URL.revokeObjectURL(svgBlobUrl);
    }
  }, [getExportFileBaseName, getSerializedSvg, triggerBlobDownload]);

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
