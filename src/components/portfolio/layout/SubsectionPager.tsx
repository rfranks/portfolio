"use client";

import { type MouseEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import MoreVert from "@mui/icons-material/MoreVert";

export type SubsectionPagerItem = {
  key: string;
  title: string;
  selectedTitle?: string;
  selectedImageSrc?: string;
  selectedImageAlt?: string;
  selectedIcon?: ReactNode;
  optionTitle?: string;
  optionSubtitle?: string | string[];
  optionLabel?: string;
  optionTypeChipLabel?: string;
  optionTypeChipColor?: ChipProps["color"];
  optionImageSrc?: string;
  optionImageAlt?: string;
  optionIcon?: ReactNode;
};

type SubsectionPagerProps = {
  items: SubsectionPagerItem[];
  currentKey?: string;
  showOrdinal?: boolean;
  selectedValueAsTitle?: boolean;
  selectedVisualSize?: number;
  selectedIconFontSize?: string;
  selectedEmojiFontSize?: string;
  optionVisualSize?: number;
  optionEmojiFontSize?: string;
  iconFrameStyle?: "default" | "none";
  selectedIconFrameStyle?: "default" | "none";
  borderlessIconButtons?: boolean;
  flatIconButtons?: boolean;
  menuId: string;
  previousAriaLabel: string;
  nextAriaLabel: string;
  selectorAriaLabel: string;
  previousButtonSx?: SxProps<Theme>;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const formatLabel = (index: number, title: string, showOrdinal: boolean) =>
  showOrdinal ? `${index + 1}. ${title}` : title;
const getTitleModeColor = (theme: Theme) =>
  theme.palette.mode === "dark"
    ? alpha(theme.palette.common.white, 0.82)
    : alpha(theme.palette.text.primary, 0.72);
const getPagerIconButtonSx =
  (
    selectedValueAsTitle: boolean,
    includeRightMargin = false,
    borderlessIconButtons = false,
    flatIconButtons = false,
  ) =>
  (theme: Theme) => ({
    ...(includeRightMargin ? { mr: 1.25 } : undefined),
    color: selectedValueAsTitle ? getTitleModeColor(theme) : theme.palette.text.secondary,
    border: borderlessIconButtons || flatIconButtons ? "none" : "1px solid",
    borderColor:
      borderlessIconButtons || flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.28)
          : alpha(theme.palette.divider, 0.95),
    bgcolor: flatIconButtons
      ? "transparent"
      : selectedValueAsTitle
        ? alpha(theme.palette.common.white, 0.03)
        : alpha(theme.palette.background.paper, 0.9),
    boxShadow: "none",
    backdropFilter: "none",
    transition: "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
    "&:hover": {
      bgcolor: flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.12)
          : alpha(theme.palette.action.hover, 0.9),
      borderColor:
        borderlessIconButtons || flatIconButtons
          ? "transparent"
          : selectedValueAsTitle
            ? alpha(theme.palette.common.white, 0.52)
            : alpha(theme.palette.text.secondary, 0.55),
      transform: flatIconButtons ? "none" : "translateY(-1px)",
    },
    "&.Mui-focusVisible": {
      bgcolor: flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.16)
          : alpha(theme.palette.action.focus, 0.95),
      borderColor:
        borderlessIconButtons || flatIconButtons
          ? "transparent"
          : selectedValueAsTitle
            ? alpha(theme.palette.common.white, 0.56)
            : alpha(theme.palette.text.secondary, 0.6),
    },
  });

export default function SubsectionPager({
  items,
  currentKey,
  showOrdinal = true,
  selectedValueAsTitle = false,
  selectedVisualSize = 24,
  selectedIconFontSize,
  selectedEmojiFontSize,
  optionVisualSize: optionVisualSizeProp,
  optionEmojiFontSize: optionEmojiFontSizeProp,
  iconFrameStyle = "default",
  selectedIconFrameStyle,
  borderlessIconButtons = false,
  flatIconButtons = false,
  menuId,
  previousAriaLabel,
  nextAriaLabel,
  selectorAriaLabel,
  previousButtonSx,
  onSelect,
  onPrevious,
  onNext,
}: SubsectionPagerProps) {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);
  const selectorOpen = Boolean(selectorAnchorEl);
  const currentIndex = useMemo(() => {
    const matchedIndex = items.findIndex((item) => item.key === currentKey);
    return matchedIndex >= 0 ? matchedIndex : 0;
  }, [currentKey, items]);
  const currentItem = items[currentIndex];
  const hasMultipleItems = items.length > 1;

  if (!currentItem || !hasMultipleItems) {
    return null;
  }

  const handleSelectorOpen = (event: MouseEvent<HTMLElement>) => {
    setSelectorAnchorEl(event.currentTarget);
  };

  const handleSelectorClose = () => {
    setSelectorAnchorEl(null);
  };

  const handleSelect = (key: string) => {
    onSelect(key);
    setSelectorAnchorEl(null);
  };
  const selectedTitleSource =
    currentItem.selectedTitle ??
    currentItem.optionTitle ??
    currentItem.optionLabel ??
    currentItem.title;
  const selectedTitle = selectedTitleSource?.trim() || currentItem.title;
  const selectedEmojiFontSizeResolved =
    selectedEmojiFontSize ?? `${Math.max(16, Math.round(selectedVisualSize * 0.78))}px`;
  const selectedIconFrameStyleResolved = selectedIconFrameStyle ?? iconFrameStyle;
  const optionVisualSize = optionVisualSizeProp ?? 52;
  const optionEmojiFontSizeResolved =
    optionEmojiFontSizeProp ?? `${Math.max(24, Math.round(optionVisualSize * 0.74))}px`;
  const previousButtonMergedSx: SxProps<Theme> = (() => {
    const base = getPagerIconButtonSx(
      selectedValueAsTitle,
      false,
      borderlessIconButtons,
      flatIconButtons,
    );
    if (!previousButtonSx) {
      return base;
    }
    if (Array.isArray(previousButtonSx)) {
      return [base, ...previousButtonSx];
    }
    return [base, previousButtonSx];
  })();
  const selectedImageSrc = currentItem.selectedImageSrc ?? currentItem.optionImageSrc;
  const selectedImageAlt =
    currentItem.selectedImageAlt ?? currentItem.optionImageAlt ?? `${currentItem.title} icon`;
  const selectedIcon = currentItem.selectedIcon ?? currentItem.optionIcon;
  const selectedVisual = selectedImageSrc ? (
    <Box
      className="subsection-pager-selected-visual"
      component="img"
      src={selectedImageSrc}
      alt={selectedImageAlt}
      sx={{
        width: selectedVisualSize,
        height: selectedVisualSize,
        borderRadius: selectedIconFrameStyleResolved === "none" ? 0 : 1.5,
        objectFit: "contain",
        border: selectedIconFrameStyleResolved === "none" ? "none" : "1px solid",
        borderColor:
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : (theme) =>
                selectedValueAsTitle
                  ? alpha(theme.palette.common.white, 0.3)
                  : theme.palette.divider,
        bgcolor: (theme) =>
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : selectedValueAsTitle
              ? alpha(theme.palette.common.white, 0.06)
              : theme.palette.background.paper,
        p: selectedIconFrameStyleResolved === "none" ? 0 : 0.2,
        flexShrink: 0,
        transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
      }}
    />
  ) : selectedIcon ? (
    <Box
      className="subsection-pager-selected-visual"
      aria-hidden="true"
      sx={{
        width: selectedVisualSize,
        height: selectedVisualSize,
        borderRadius: selectedIconFrameStyleResolved === "none" ? 0 : 1.5,
        border: selectedIconFrameStyleResolved === "none" ? "none" : "1px solid",
        borderColor:
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : (theme) =>
                selectedValueAsTitle
                  ? alpha(theme.palette.common.white, 0.3)
                  : theme.palette.divider,
        bgcolor: (theme) =>
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : selectedValueAsTitle
              ? alpha(theme.palette.common.white, 0.06)
              : theme.palette.background.paper,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: selectedValueAsTitle ? "currentColor" : "text.secondary",
        flexShrink: 0,
        "& .MuiSvgIcon-root": {
          fontSize: selectedIconFontSize ?? "1rem",
        },
        "& .MuiTypography-root": {
          fontSize: selectedEmojiFontSizeResolved,
          lineHeight: 1,
        },
        transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
      }}
    >
      {selectedIcon}
    </Box>
  ) : null;

  return (
    <>
      <Box
        sx={{
          flexShrink: 0,
          mt: 0.5,
          mx: 0.75,
          px: 1,
          py: 0.5,
          borderBottom: selectedValueAsTitle ? "none" : "1px solid",
          borderColor: "divider",
          ...(selectedValueAsTitle
            ? {
                bgcolor: "transparent",
                boxShadow: "none",
                backdropFilter: "none",
              }
            : undefined),
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            size="small"
            aria-label={previousAriaLabel}
            onClick={onPrevious}
            sx={previousButtonMergedSx}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Chip
            clickable
            color="primary"
            variant="outlined"
            onClick={handleSelectorOpen}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {selectedVisual}
                <Typography
                  component="span"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: selectedValueAsTitle
                      ? { xs: "1.22rem", md: "1.38rem" }
                      : { xs: "1.12rem", md: "1.24rem" },
                    lineHeight: selectedValueAsTitle ? 1.12 : 1.2,
                    fontWeight: 800,
                    color: selectedValueAsTitle ? (theme) => getTitleModeColor(theme) : undefined,
                  }}
                >
                  {formatLabel(currentIndex, selectedTitle, showOrdinal)}
                </Typography>
              </Box>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={{
              minWidth: 0,
              maxWidth: "100%",
              justifySelf: "stretch",
              ...(selectedValueAsTitle
                ? {
                    border: "0 !important",
                    borderColor: "transparent !important",
                    color: "text.secondary",
                    bgcolor: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    boxShadow: "none !important",
                    backdropFilter: "none !important",
                    filter: "none !important",
                    borderRadius: 1.5,
                    transition: "background-color 180ms ease, transform 180ms ease",
                    "&.MuiChip-outlined": {
                      border: "0 !important",
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08) !important",
                      backgroundColor: "rgba(255,255,255,0.08) !important",
                      transform: "translateY(-1px)",
                    },
                    "&:hover .subsection-pager-selected-visual": {
                      ...(selectedIconFrameStyleResolved === "none"
                        ? {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                            transform: "none",
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.52)",
                            backgroundColor: "rgba(255,255,255,0.14)",
                            transform: "translateY(-1px) scale(1.04)",
                          }),
                    },
                    "&.Mui-focusVisible": {
                      bgcolor: "rgba(255,255,255,0.12) !important",
                      backgroundColor: "rgba(255,255,255,0.12) !important",
                    },
                    "&.Mui-focusVisible .subsection-pager-selected-visual": {
                      ...(selectedIconFrameStyleResolved === "none"
                        ? {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.52)",
                            backgroundColor: "rgba(255,255,255,0.14)",
                          }),
                    },
                  }
                : undefined),
              "& .MuiChip-label": {
                width: "100%",
                overflow: "hidden",
                display: "block",
                py: 0.15,
              },
            }}
          />
          <IconButton
            size="small"
            aria-label={nextAriaLabel}
            onClick={onNext}
            sx={getPagerIconButtonSx(
              selectedValueAsTitle,
              false,
              borderlessIconButtons,
              flatIconButtons,
            )}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={selectorAriaLabel}
            size="small"
            onClick={handleSelectorOpen}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={getPagerIconButtonSx(
              selectedValueAsTitle,
              true,
              borderlessIconButtons,
              flatIconButtons,
            )}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Menu
        id={menuId}
        anchorEl={selectorAnchorEl}
        open={selectorOpen}
        onClose={handleSelectorClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: { xs: 260, sm: 320 },
            },
          },
        }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={item.key}
            selected={index === currentIndex}
            onClick={() => handleSelect(item.key)}
            sx={
              item.optionImageSrc || item.optionIcon
                ? {
                    display: "grid",
                    gridTemplateColumns: `${Math.max(40, optionVisualSize)}px minmax(0, 1fr)`,
                    columnGap: 1.25,
                    alignItems: "start",
                    py: 1.15,
                  }
                : undefined
            }
          >
            {item.optionImageSrc ? (
              <Box
                component="img"
                src={item.optionImageSrc}
                alt={item.optionImageAlt || `${item.title} logo`}
                sx={{
                  width: optionVisualSize,
                  height: optionVisualSize,
                  mt: 0.1,
                  borderRadius: iconFrameStyle === "none" ? 0 : 1.5,
                  objectFit: "contain",
                  border: iconFrameStyle === "none" ? "none" : "1px solid",
                  borderColor: iconFrameStyle === "none" ? "transparent" : "divider",
                  bgcolor: iconFrameStyle === "none" ? "transparent" : "background.paper",
                  p: iconFrameStyle === "none" ? 0 : 0.5,
                }}
              />
            ) : item.optionIcon ? (
              <Box
                aria-hidden="true"
                sx={{
                  width: optionVisualSize,
                  height: optionVisualSize,
                  mt: 0.1,
                  borderRadius: iconFrameStyle === "none" ? 0 : 1.5,
                  border: iconFrameStyle === "none" ? "none" : "1px solid",
                  borderColor: iconFrameStyle === "none" ? "transparent" : "divider",
                  bgcolor: iconFrameStyle === "none" ? "transparent" : "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  color: "text.secondary",
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.55rem",
                  },
                  "& .MuiTypography-root": {
                    fontSize: `min(${optionEmojiFontSizeResolved}, ${Math.max(
                      18,
                      Math.round(optionVisualSize * 0.82),
                    )}px)`,
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                  },
                }}
              >
                {item.optionIcon}
              </Box>
            ) : null}
            <Box
              sx={{
                minWidth: 0,
                ...(item.optionImageSrc || item.optionIcon ? { gridColumn: 2 } : undefined),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 0.75,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    flex: "1 1 auto",
                    fontWeight: 600,
                    lineHeight: 1.3,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.optionTitle ??
                    item.optionLabel ??
                    formatLabel(index, item.title, showOrdinal)}
                </Typography>
                {item.optionTypeChipLabel ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={item.optionTypeChipColor ?? "default"}
                    label={item.optionTypeChipLabel}
                    sx={{
                      flexShrink: 0,
                      height: 20,
                      "& .MuiChip-label": {
                        px: 0.8,
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        letterSpacing: "0.01em",
                      },
                    }}
                  />
                ) : null}
              </Box>
              {item.optionSubtitle ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.25,
                    whiteSpace: "pre-line",
                    lineHeight: 1.35,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {Array.isArray(item.optionSubtitle)
                    ? item.optionSubtitle.filter(Boolean).join("\n")
                    : item.optionSubtitle}
                </Typography>
              ) : null}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
