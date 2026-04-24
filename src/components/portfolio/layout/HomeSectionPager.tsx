"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ChevronLeft, ChevronRight, MoreVert } from "@mui/icons-material";
import type { NavigationIconConfig } from "@/components/portfolio/layout/navigationIcons";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import {
  getPagerIconButtonFrameSx,
  getPagerIconButtonSx,
  getPagerSelectedChipSx,
  getPagerSelectedTextSx,
  PAGER_OVERFLOW_ACTION_DISPLAY_SX,
} from "@/components/portfolio/layout/pagerFoundation";

export type HomeSectionPagerItem = NavigationIconConfig & {
  id: string;
  label: string;
};

type HomeSectionPagerProps = {
  items: HomeSectionPagerItem[];
  currentSectionId: string;
  onSelectSection: (sectionId: string) => void;
};

const formatSelectedLabel = (index: number, label: string) => `${toRoman(index + 1)}. ${label}`;
const formatOptionLabel = (index: number, label: string) => `${toRoman(index + 1)}. ${label}`;

const toRoman = (value: number): string => {
  if (value <= 0) {
    return "0";
  }

  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remainder = Math.floor(value);
  let result = "";

  for (const [decimal, roman] of numerals) {
    while (remainder >= decimal) {
      result += roman;
      remainder -= decimal;
    }
  }

  return result || "0";
};

export default function HomeSectionPager({
  items,
  currentSectionId,
  onSelectSection,
}: HomeSectionPagerProps) {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);

  const currentIndex = useMemo(() => {
    const index = items.findIndex((item) => item.id === currentSectionId);
    return index >= 0 ? index : 0;
  }, [currentSectionId, items]);
  const currentItem = items[currentIndex];
  const hasItems = items.length > 0;
  const hasMultipleItems = items.length > 1;
  const selectorOpen = Boolean(selectorAnchorEl);

  const handleSelectorOpen = (event: MouseEvent<HTMLElement>) => {
    setSelectorAnchorEl(event.currentTarget);
  };

  const handleSelectorClose = () => {
    setSelectorAnchorEl(null);
  };

  const handleSelect = (sectionId: string) => {
    onSelectSection(sectionId);
    setSelectorAnchorEl(null);
  };

  const previousItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
  const wrappedPreviousItem = previousItem ?? (hasMultipleItems ? items[items.length - 1] : null);
  const wrappedNextItem = nextItem ?? (hasMultipleItems ? items[0] : null);
  const pagerIconButtonBaseSx = getPagerIconButtonSx({ selectedValueAsTitle: true });
  const pagerIconButtonFrameSx = getPagerIconButtonFrameSx({ selectedValueAsTitle: true });
  const pagerIconButtonSx: SxProps<Theme> = [pagerIconButtonBaseSx, pagerIconButtonFrameSx];

  useEffect(() => {
    const handleShortcutPrevious = () => {
      if (!wrappedPreviousItem) {
        return;
      }
      onSelectSection(wrappedPreviousItem.id);
    };

    const handleShortcutNext = () => {
      if (!wrappedNextItem) {
        return;
      }
      onSelectSection(wrappedNextItem.id);
    };

    window.addEventListener("portfolio:shortcut:home-prev", handleShortcutPrevious);
    window.addEventListener("portfolio:shortcut:home-next", handleShortcutNext);
    return () => {
      window.removeEventListener("portfolio:shortcut:home-prev", handleShortcutPrevious);
      window.removeEventListener("portfolio:shortcut:home-next", handleShortcutNext);
    };
  }, [onSelectSection, wrappedNextItem, wrappedPreviousItem]);

  if (!hasItems || !currentItem) {
    return null;
  }

  return (
    <>
      <Box
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && wrappedPreviousItem) {
            event.preventDefault();
            onSelectSection(wrappedPreviousItem.id);
            return;
          }

          if (event.key === "ArrowRight" && wrappedNextItem) {
            event.preventDefault();
            onSelectSection(wrappedNextItem.id);
            return;
          }

          if ((event.key === "Enter" || event.key === " ") && hasMultipleItems) {
            event.preventDefault();
            setSelectorAnchorEl(event.currentTarget);
          }
        }}
        sx={{
          px: { xs: 1.75, md: 2.5 },
          py: { xs: 1, sm: 1.05, md: 1.2 },
          minHeight: { xs: 46, sm: 50, md: 74 },
          border: "none",
          borderRadius: 0,
          bgcolor: "transparent",
          backgroundImage: "none",
          color: "common.white",
          boxShadow: "none",
          backdropFilter: "none",
          filter: "none",
          display: "flex",
          alignItems: "center",
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 1,
            width: "100%",
            overflow: "visible",
          }}
        >
          <IconButton
            aria-label="Previous section"
            size="small"
            disabled={!wrappedPreviousItem}
            onClick={() => {
              if (wrappedPreviousItem) {
                onSelectSection(wrappedPreviousItem.id);
              }
            }}
            sx={pagerIconButtonSx}
          >
            <ChevronLeft />
          </IconButton>
          <Chip
            clickable
            color="default"
            variant="outlined"
            size="medium"
            onClick={handleSelectorOpen}
            label={
              <Typography
                component="span"
                sx={getPagerSelectedTextSx({ selectedValueAsTitle: true })}
              >
                {formatSelectedLabel(currentIndex, currentItem.label)}
              </Typography>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "home-section-selector-menu" : undefined}
            sx={getPagerSelectedChipSx({ selectedValueAsTitle: true })}
          />
          <IconButton
            aria-label="Next section"
            size="small"
            disabled={!wrappedNextItem}
            onClick={() => {
              if (wrappedNextItem) {
                onSelectSection(wrappedNextItem.id);
              }
            }}
            sx={pagerIconButtonSx}
          >
            <ChevronRight />
          </IconButton>
          <IconButton
            aria-label="Open section selector"
            size="small"
            onClick={handleSelectorOpen}
            disabled={!hasMultipleItems}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "home-section-selector-menu" : undefined}
            sx={[
              pagerIconButtonBaseSx,
              pagerIconButtonFrameSx,
              {
                display: PAGER_OVERFLOW_ACTION_DISPLAY_SX,
              },
            ]}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Menu
        id="home-section-selector-menu"
        anchorEl={selectorAnchorEl}
        open={selectorOpen}
        onClose={handleSelectorClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: { xs: 280, sm: 340 },
            },
          },
        }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={item.id}
            selected={index === currentIndex}
            onClick={() => handleSelect(item.id)}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {renderNavigationIcon(item, {
                fallbackIconKey: "home",
                fontSize: "small",
                emojiSize: "1rem",
              })}
            </ListItemIcon>
            <ListItemText>{formatOptionLabel(index, item.label)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
