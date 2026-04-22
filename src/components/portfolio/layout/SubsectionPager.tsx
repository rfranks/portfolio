"use client";

import { type MouseEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
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
  selectedValueAsTitle?: boolean;
  selectedVisualSize?: number;
  selectedIconFontSize?: string;
  menuId: string;
  previousAriaLabel: string;
  nextAriaLabel: string;
  selectorAriaLabel: string;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const formatLabel = (index: number, title: string) => `${index + 1}. ${title}`;

export default function SubsectionPager({
  items,
  currentKey,
  selectedValueAsTitle = false,
  selectedVisualSize = 24,
  selectedIconFontSize = "0.95rem",
  menuId,
  previousAriaLabel,
  nextAriaLabel,
  selectorAriaLabel,
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
  const selectedVisual = currentItem.selectedImageSrc ? (
    <Box
      component="img"
      src={currentItem.selectedImageSrc}
      alt={currentItem.selectedImageAlt || `${currentItem.title} icon`}
      sx={{
        width: selectedVisualSize,
        height: selectedVisualSize,
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    />
  ) : currentItem.selectedIcon ? (
    <Box
      aria-hidden="true"
      sx={{
        width: selectedVisualSize,
        height: selectedVisualSize,
        borderRadius: "50%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        flexShrink: 0,
        "& .MuiSvgIcon-root": {
          fontSize: selectedIconFontSize,
        },
      }}
    >
      {currentItem.selectedIcon}
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
            sx={
              selectedValueAsTitle
                ? (theme) => ({
                    color:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.9)
                        : theme.palette.text.primary,
                    bgcolor: "transparent",
                    boxShadow: "none",
                    backdropFilter: "none",
                    "&:hover": {
                      bgcolor: "transparent",
                    },
                  })
                : undefined
            }
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
                    color: selectedValueAsTitle
                      ? (theme) => alpha(theme.palette.common.white, 0.96)
                      : undefined,
                  }}
                >
                  {formatLabel(currentIndex, selectedTitle)}
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
                    borderColor: "transparent",
                    color: "common.white",
                    bgcolor: "transparent",
                    boxShadow: "none",
                    backdropFilter: "none",
                    "&:hover": {
                      bgcolor: "transparent",
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
            sx={
              selectedValueAsTitle
                ? (theme) => ({
                    color:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.9)
                        : theme.palette.text.primary,
                    bgcolor: "transparent",
                    boxShadow: "none",
                    backdropFilter: "none",
                    "&:hover": {
                      bgcolor: "transparent",
                    },
                  })
                : undefined
            }
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
            sx={
              selectedValueAsTitle
                ? (theme) => ({
                    mr: 1.25,
                    color:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.9)
                        : theme.palette.text.primary,
                    bgcolor: "transparent",
                    boxShadow: "none",
                    backdropFilter: "none",
                    "&:hover": {
                      bgcolor: "transparent",
                    },
                  })
                : { mr: 1.25 }
            }
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
                    gridTemplateColumns: "52px minmax(0, 1fr)",
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
                  width: 52,
                  height: 52,
                  mt: 0.1,
                  borderRadius: 1.5,
                  objectFit: "contain",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  p: 0.5,
                }}
              />
            ) : item.optionIcon ? (
              <Box
                aria-hidden="true"
                sx={{
                  width: 52,
                  height: 52,
                  mt: 0.1,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
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
                  {item.optionTitle ?? item.optionLabel ?? formatLabel(index, item.title)}
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
