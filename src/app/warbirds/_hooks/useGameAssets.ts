"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetMgr } from "@/types/game/ui";
import {
  loadAssetImage,
  loadAssetImageList,
  loadAssetImageMatrix,
  loadAssetImageRecord,
} from "@/utils/game/assetManifest";
import { withBasePath } from "@/utils/basePath";
import { createWarbirdsAssetManifest } from "../_consts/assetManifest";

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

    const manifest = createWarbirdsAssetManifest();

    assetRefs.current.airshipFrames = loadAssetImageMatrix(loadImg, manifest.airshipFramesByColor);
    assetRefs.current.artilleryImg = loadAssetImage(loadImg, manifest.artilleryImg);
    assetRefs.current.blackSmokeImgs = loadAssetImageList(loadImg, manifest.blackSmokeImgs);
    assetRefs.current.brokenStickImg = loadAssetImage(loadImg, manifest.brokenStickImg);
    assetRefs.current.bulletHoleImg = loadAssetImage(loadImg, manifest.bulletHoleImg);
    assetRefs.current.cannonballImg = loadAssetImage(loadImg, manifest.cannonballImg);
    assetRefs.current.digitImgs = loadAssetImageRecord(loadImg, manifest.digitImgsByChar);
    assetRefs.current.duckImgs = loadAssetImageList(loadImg, manifest.duckImgs);
    assetRefs.current.duckOutlineImgs = loadAssetImageList(loadImg, manifest.duckOutlineImgs);
    assetRefs.current.duckTargetImgs = loadAssetImageList(loadImg, manifest.duckTargetImgs);
    assetRefs.current.enemyImgs = loadAssetImageList(loadImg, manifest.enemyImgs);
    assetRefs.current.enemyFrames = Object.values(
      loadAssetImageMatrix(loadImg, manifest.enemyFramesByBaseColor),
    );
    assetRefs.current.explosionImgs = loadAssetImageList(loadImg, manifest.explosionImgs);
    assetRefs.current.fireImgs = loadAssetImageList(loadImg, manifest.fireImgs);
    assetRefs.current.flameImgs = loadAssetImageList(loadImg, manifest.flameImgs);
    assetRefs.current.groundImgs = loadAssetImageList(loadImg, manifest.groundImgs);
    assetRefs.current.homingImg = loadAssetImage(loadImg, manifest.homingImg);
    assetRefs.current.letterImgs = loadAssetImageRecord(loadImg, manifest.letterImgsByChar);
    assetRefs.current.medalFrames = manifest.medalFrames.map((frameSet) =>
      loadAssetImageList(loadImg, frameSet),
    );
    assetRefs.current.napalmImg = loadAssetImage(loadImg, manifest.napalmImg);
    assetRefs.current.numberImgs = loadAssetImageRecord(loadImg, manifest.numberImgsByChar);
    assetRefs.current.planeFrames = loadAssetImageList(loadImg, manifest.planeFrames);
    assetRefs.current.planeImg = (assetRefs.current.planeFrames as HTMLImageElement[])[0];
    assetRefs.current.plusImg = loadAssetImage(loadImg, manifest.plusImg);
    assetRefs.current.powerupImgs = loadAssetImageRecord(loadImg, manifest.powerupImgsByType);
    assetRefs.current.puffLargeImg = loadAssetImage(loadImg, manifest.puffLargeImg);
    assetRefs.current.puffSmallImg = loadAssetImage(loadImg, manifest.puffSmallImg);
    assetRefs.current.rockImgs = loadAssetImageList(loadImg, manifest.rockImgs);
    assetRefs.current.shieldImg = loadAssetImage(loadImg, manifest.shieldImg);
    assetRefs.current.sparkImgs = loadAssetImageList(loadImg, manifest.sparkImgs);
    assetRefs.current.laserBeamImgs = loadAssetImageList(loadImg, manifest.laserBeamImgs);
    assetRefs.current.stickImg = loadAssetImage(loadImg, manifest.stickImg);
    assetRefs.current.targetImgs = loadAssetImageList(loadImg, manifest.targetImgs);
    assetRefs.current.treeImgs = loadAssetImageList(loadImg, manifest.treeImgs);
    assetRefs.current.waterImgs = loadAssetImageList(loadImg, manifest.waterImgs);
    assetRefs.current.whitePuffImgs = loadAssetImageList(loadImg, manifest.whitePuffImgs);

    setReady(true);
  }, []);

  const get = useCallback<AssetMgr["get"]>((key: string) => assetRefs.current[key], []);
  const getImg = useCallback<AssetMgr["getImg"]>(
    (key: string) => assetRefs.current[key] ?? undefined,
    [],
  );

  return { get, getImg, assetRefs: assetRefs.current, ready };
}
