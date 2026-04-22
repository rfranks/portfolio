"use client";

import { type MouseEvent, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { ChevronLeft, ChevronRight, MoreVert } from "@mui/icons-material";
import type { NavigationIconConfig } from "@/components/portfolio/layout/navigationIcons";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";

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

  if (!hasItems || !currentItem) {
    return null;
  }

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

  return (
    <>
      <Box
        sx={{
          px: { xs: 1.75, md: 2.25 },
          py: { xs: 0.75, md: 0.9 },
          border: "none",
          borderRadius: 0,
          bgcolor: "transparent",
          color: "common.white",
          boxShadow: "none",
          backdropFilter: "none",
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
            aria-label="Previous section"
            size="small"
            disabled={!wrappedPreviousItem}
            onClick={() => {
              if (wrappedPreviousItem) {
                onSelectSection(wrappedPreviousItem.id);
              }
            }}
            sx={{
              p: 0.45,
              color: "inherit",
              borderRadius: "999px",
              transition: "background-color 160ms ease, transform 160ms ease",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
              },
              "&:focus-visible": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.12),
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Chip
            clickable
            color="default"
            variant="outlined"
            size="small"
            onClick={handleSelectorOpen}
            label={
              <Typography
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: { xs: "0.84rem", sm: "0.96rem", md: "1.28rem" },
                  lineHeight: 1.1,
                  fontWeight: 900,
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                {formatSelectedLabel(currentIndex, currentItem.label)}
              </Typography>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "home-section-selector-menu" : undefined}
            sx={{
              minWidth: 0,
              maxWidth: "100%",
              justifySelf: "stretch",
              border: "0 !important",
              borderColor: "transparent !important",
              bgcolor: "transparent !important",
              backgroundColor: "transparent !important",
              backgroundImage: "none !important",
              boxShadow: "none !important",
              backdropFilter: "none !important",
              filter: "none !important",
              color: "inherit",
              borderRadius: "999px",
              transition: "background-color 160ms ease, box-shadow 160ms ease",
              "&.MuiChip-outlined": {
                border: "0 !important",
              },
              "&:hover, &.Mui-focusVisible, &:active": {
                bgcolor: (theme) => `${alpha(theme.palette.common.white, 0.1)} !important`,
                backgroundColor: (theme) => `${alpha(theme.palette.common.white, 0.1)} !important`,
                boxShadow: "none !important",
                backdropFilter: "none !important",
                filter: "none !important",
              },
              "& .MuiChip-label": {
                width: "100%",
                overflow: "hidden",
                display: "block",
                py: 0,
                textAlign: "left",
              },
            }}
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
            sx={{
              p: 0.45,
              color: "inherit",
              borderRadius: "999px",
              transition: "background-color 160ms ease, transform 160ms ease",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
              },
              "&:focus-visible": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.12),
              },
            }}
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
            sx={{
              p: 0.45,
              color: "inherit",
              borderRadius: "999px",
              transition: "background-color 160ms ease, transform 160ms ease",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
              },
              "&:focus-visible": {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.12),
              },
            }}
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
