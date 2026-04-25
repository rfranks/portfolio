"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetMgr } from "@/types/game/ui";
import {
  loadAssetImage,
  loadAssetImageList,
  loadAssetImageRecord,
} from "@/utils/game/assetManifest";
import { withBasePath } from "@/utils/basePath";
import { createZombiefishAssetManifest } from "../_consts/assetManifest";

export function useGameAssets(): {
  get: AssetMgr["get"];
  getImg: AssetMgr["getImg"];
  assetRefs: AssetMgr["assetRefs"];
  ready: boolean;
} {
  const [ready, setReady] = useState(false);
  const assetRefs = useRef<AssetMgr["assetRefs"]>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadImg = (src: string, fallbackSrcs?: readonly string[]) => {
      const img = new window.Image();
      const attemptedPaths = new Set<string>();
      const fallbackQueue = [...(fallbackSrcs ?? [])];

      const applySource = (nextSrc: string) => {
        attemptedPaths.add(nextSrc);
        img.src = withBasePath(nextSrc);
      };

      img.onerror = () => {
        while (fallbackQueue.length > 0) {
          const fallbackSrc = fallbackQueue.shift();
          if (!fallbackSrc || attemptedPaths.has(fallbackSrc)) {
            continue;
          }
          applySource(fallbackSrc);
          return;
        }
      };

      applySource(src);
      return img;
    };

    const manifest = createZombiefishAssetManifest();

    const buildFramesFromSpritesheet = (args: {
      sheet: HTMLImageElement;
      frameSize: number;
      coordsByKind: Record<string, readonly [number, number][]>;
    }): Record<string, HTMLImageElement[]> => {
      return Object.fromEntries(
        Object.entries(args.coordsByKind).map(([kind, coords]) => [
          kind,
          coords.map(([sx, sy]) => {
            const canvas = document.createElement("canvas");
            canvas.width = args.frameSize;
            canvas.height = args.frameSize;

            const ctx = canvas.getContext("2d");
            ctx?.drawImage(
              args.sheet,
              sx,
              sy,
              args.frameSize,
              args.frameSize,
              0,
              0,
              args.frameSize,
              args.frameSize,
            );

            const image = new window.Image();
            image.src = canvas.toDataURL();
            return image;
          }),
        ]),
      );
    };

    const sheet = loadAssetImage(loadImg, manifest.spritesheet.src);
    sheet.onload = () => {
      assetRefs.current.fishFrames = buildFramesFromSpritesheet({
        sheet,
        frameSize: manifest.spritesheet.frameSize,
        coordsByKind: manifest.spritesheet.fishCoordsByKind,
      });

      assetRefs.current.skeletonFrames = buildFramesFromSpritesheet({
        sheet,
        frameSize: manifest.spritesheet.frameSize,
        coordsByKind: manifest.spritesheet.skeletonCoordsByKind,
      });

      setReady(true);
    };

    assetRefs.current.fishImgs = loadAssetImageRecord(loadImg, manifest.fishImgsByType);
    assetRefs.current.fishFlashImg = loadAssetImage(loadImg, manifest.fishFlashImg);
    assetRefs.current.bubbleImgs = loadAssetImageRecord(loadImg, manifest.bubbleImgsByType);
    assetRefs.current.seaGrassImgs = loadAssetImageRecord(loadImg, manifest.seaGrassImgsByType);
    assetRefs.current.seaweedImgs = loadAssetImageRecord(loadImg, manifest.seaweedImgsByType);
    assetRefs.current.surfaceImgs = loadAssetImageList(loadImg, manifest.surfaceImgs);
    assetRefs.current.cloudImgs = loadAssetImageList(loadImg, manifest.cloudImgs);
    assetRefs.current.terrainDirtImgs = loadAssetImageRecord(
      loadImg,
      manifest.terrainDirtImgsByType,
    );
    assetRefs.current.terrainSandImgs = loadAssetImageRecord(
      loadImg,
      manifest.terrainSandImgsByType,
    );
    assetRefs.current.terrainWaterImgs = loadAssetImageRecord(
      loadImg,
      manifest.terrainWaterImgsByType,
    );
    assetRefs.current.digitImgs = loadAssetImageRecord(loadImg, manifest.digitImgsByChar);
    assetRefs.current.letterImgs = loadAssetImageRecord(loadImg, manifest.letterImgsByChar);

    assetRefs.current.dotImg = loadAssetImage(loadImg, manifest.dotImg);
    assetRefs.current.pctImg = loadAssetImage(loadImg, manifest.pctImg);
    assetRefs.current.plusImg = loadAssetImage(loadImg, manifest.plusImg);

    const minusCanvas = document.createElement("canvas");
    minusCanvas.width = assetRefs.current.plusImg.width || 32;
    minusCanvas.height = assetRefs.current.plusImg.height || 32;
    const minusCtx = minusCanvas.getContext("2d");
    if (minusCtx) {
      minusCtx.fillStyle = "white";
      const barHeight = Math.max(1, Math.floor(minusCanvas.height / 5));
      const y = Math.floor((minusCanvas.height - barHeight) / 2);
      minusCtx.fillRect(0, y, minusCanvas.width, barHeight);
    }

    const minusImg = new window.Image();
    minusImg.src = minusCanvas.toDataURL();
    assetRefs.current.minusImg = minusImg;
  }, []);

  const get = useCallback<AssetMgr["get"]>((key: string) => assetRefs.current[key], []);
  const getImg = useCallback<AssetMgr["getImg"]>(
    (key: string) => assetRefs.current[key] ?? undefined,
    [],
  );

  return { get, getImg, assetRefs: assetRefs.current, ready };
}
