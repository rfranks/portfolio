import type { SxProps, Theme } from "@mui/material/styles";
import type { FlatSx, FlatSxArray } from "@/types/sx/sx";

const isFlatSxValue = (entry: unknown): entry is FlatSx =>
  entry !== null && entry !== undefined && entry !== false && !Array.isArray(entry);

export function toSxArray(value?: SxProps<Theme>): FlatSxArray {
  if (value == null) {
    return [];
  }

  const flattened: FlatSxArray = [];
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
