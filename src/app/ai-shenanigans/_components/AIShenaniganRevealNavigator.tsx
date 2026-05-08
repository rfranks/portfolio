"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { useRevealStateEngine } from "../_hooks/useRevealStateEngine";
import type { RevealTimelineItem, RevealViewMode } from "../_types/revealStateEngine";

type AIShenaniganRevealNavigatorProps<TKey extends string> = {
  items: RevealTimelineItem<TKey>[];
  onSelect: (key: TKey) => void;
  mode: RevealViewMode;
  onModeChange: (mode: RevealViewMode) => void;
  scope: string;
};

const unreachedItemSx: SxProps<Theme> = {
  borderStyle: "dashed",
  borderColor: "rgba(148,163,184,0.55)",
  color: "rgba(148,163,184,0.88)",
  backgroundColor: (theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.grey[500], 0.08)
      : "rgba(148,163,184,0.06)",
  "& .MuiChip-label": {
    fontStyle: "italic",
  },
};

export default function AIShenaniganRevealNavigator<TKey extends string>({
  items,
  onSelect,
  mode,
  onModeChange,
  scope,
}: AIShenaniganRevealNavigatorProps<TKey>) {
  const revealState = useRevealStateEngine({
    items,
    mode,
    onModeChange,
    defaultMode: mode,
  });

  const displayedIndices =
    revealState.mode === "timeline" ? items.map((_, index) => index) : revealState.displayedIndices;

  return (
    <Stack spacing={1.25} sx={{ mt: 2.25 }}>
      <Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={revealState.mode}
          onChange={(_, value: RevealViewMode | null) => {
            if (!value) {
              return;
            }
            revealState.setMode(value);
          }}
        >
          <ToggleButton value="chips">Chips</ToggleButton>
          <ToggleButton value="timeline">Timeline</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {revealState.mode === "timeline" ? (
        <Stack spacing={0.75}>
          {items.map((item, index) => {
            const hasNext = index < items.length - 1;
            return (
              <Stack
                key={`${scope}-${item.key}`}
                direction="row"
                spacing={1.1}
                alignItems="stretch"
              >
                <Stack alignItems="center" sx={{ minWidth: 12 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      mt: 1,
                      bgcolor: item.active
                        ? "primary.main"
                        : item.reached
                          ? "success.main"
                          : "text.disabled",
                    }}
                  />
                  {hasNext && (
                    <Box
                      aria-hidden
                      sx={{
                        width: 2,
                        flex: 1,
                        minHeight: 12,
                        my: 0.4,
                        bgcolor: item.reached ? "divider" : alpha("#94a3b8", 0.45),
                      }}
                    />
                  )}
                </Stack>
                <Chip
                  label={item.label}
                  color={item.active ? "primary" : "default"}
                  variant={item.active ? "filled" : "outlined"}
                  size="small"
                  clickable={item.reached}
                  onClick={item.reached ? () => onSelect(item.key) : undefined}
                  sx={item.reached ? undefined : unreachedItemSx}
                />
              </Stack>
            );
          })}
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ alignItems: "center" }}>
          {displayedIndices.map((index, chipPosition) => {
            const item = items[index];
            if (!item) {
              return null;
            }

            const hasNextChip = chipPosition < displayedIndices.length - 1;
            return (
              <Box
                key={`${scope}-${item.key}`}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Chip
                  label={item.label}
                  color={item.active ? "primary" : "default"}
                  variant={item.active ? "filled" : "outlined"}
                  size="small"
                  clickable={item.reached}
                  onClick={item.reached ? () => onSelect(item.key) : undefined}
                  sx={item.reached ? undefined : unreachedItemSx}
                />
                {hasNextChip && (
                  <Typography
                    aria-hidden="true"
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      color: revealState.useCondensedChips
                        ? "text.disabled"
                        : item.active
                          ? "primary.main"
                          : "text.disabled",
                      transform: "translateY(-1px)",
                      transition: "color 180ms ease",
                      userSelect: "none",
                    }}
                  >
                    {revealState.useCondensedChips ? "..." : "→"}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
