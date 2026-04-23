import type { SxProps, Theme } from "@mui/material/styles";
import type {
  MediaCyclerFlatSx,
  MediaCyclerFlatSxArray,
  MediaCyclerSxArray,
} from "@/types/media/mediaCyclerSx";

const isFlatSxValue = (entry: unknown): entry is MediaCyclerFlatSx =>
  entry !== null && entry !== undefined && entry !== false && !Array.isArray(entry);

export function toMediaCyclerSxArray(value?: SxProps<Theme>): MediaCyclerSxArray {
  if (value == null) {
    return [];
  }

  const flattened: MediaCyclerSxArray = [];
  const append = (entry: unknown) => {
    if (entry == null || entry === false) {
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(append);
      return;
    }

    if (isFlatSxValue(entry)) {
      flattened.push(entry);
    }
  };

  append(value);
  return flattened;
}

export function flattenMediaCyclerSxArray(values: MediaCyclerSxArray): MediaCyclerFlatSxArray {
  const flattened: MediaCyclerFlatSxArray = [];

  const append = (entry: unknown) => {
    if (entry == null || entry === false) {
      return;
    }
    if (Array.isArray(entry)) {
      entry.forEach(append);
      return;
    }
    if (isFlatSxValue(entry)) {
      flattened.push(entry);
    }
  };

  values.forEach(append);
  return flattened;
}
