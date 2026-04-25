export type AssetImageSpec =
  | string
  | {
      src: string;
      fallbackSrcs?: readonly string[];
    };

export type AssetImageLoader = (src: string, fallbackSrcs?: readonly string[]) => HTMLImageElement;

function normalizeAssetImageSpec(spec: AssetImageSpec): {
  src: string;
  fallbackSrcs?: readonly string[];
} {
  if (typeof spec === "string") {
    return { src: spec };
  }
  return {
    src: spec.src,
    fallbackSrcs: spec.fallbackSrcs,
  };
}

export function loadAssetImage(
  loadImage: AssetImageLoader,
  spec: AssetImageSpec,
): HTMLImageElement {
  const normalized = normalizeAssetImageSpec(spec);
  return loadImage(normalized.src, normalized.fallbackSrcs);
}

export function loadAssetImageList(
  loadImage: AssetImageLoader,
  specs: readonly AssetImageSpec[],
): HTMLImageElement[] {
  return specs.map((spec) => loadAssetImage(loadImage, spec));
}

export function loadAssetImageRecord<TKeys extends string>(
  loadImage: AssetImageLoader,
  specsByKey: Record<TKeys, AssetImageSpec>,
): Record<TKeys, HTMLImageElement> {
  const entries = Object.entries(specsByKey) as Array<[TKeys, AssetImageSpec]>;
  return Object.fromEntries(
    entries.map(([key, spec]) => [key, loadAssetImage(loadImage, spec)]),
  ) as Record<TKeys, HTMLImageElement>;
}

export function loadAssetImageMatrix<TKeys extends string>(
  loadImage: AssetImageLoader,
  specsByKey: Record<TKeys, readonly AssetImageSpec[]>,
): Record<TKeys, HTMLImageElement[]> {
  const entries = Object.entries(specsByKey) as Array<[TKeys, readonly AssetImageSpec[]]>;
  return Object.fromEntries(
    entries.map(([key, specs]) => [key, loadAssetImageList(loadImage, specs)]),
  ) as Record<TKeys, HTMLImageElement[]>;
}
