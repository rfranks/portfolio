import type { SxProps, Theme } from "@mui/material/styles";
import { GRID_CLOUD_STAGGER_REVEAL } from "@/consts/components/shared/gridCloudNavigationSlide";

export const mergeSx = (base: SxProps<Theme>, override?: SxProps<Theme>): SxProps<Theme> =>
  (override ? [base, override] : base) as SxProps<Theme>;

export const clampVirtualizedIndex = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const buildStaggerNthRules = (selector: string) => {
  const rules: Record<string, Record<string, string>> = {};
  for (let index = 1; index <= GRID_CLOUD_STAGGER_REVEAL.MAX_INDEX; index += 1) {
    rules[`& ${selector}:nth-of-type(${index})`] = {
      animationDelay: `${
        GRID_CLOUD_STAGGER_REVEAL.BASE_DELAY_MS + GRID_CLOUD_STAGGER_REVEAL.STEP_MS * (index - 1)
      }ms`,
    };
  }
  return rules;
};
