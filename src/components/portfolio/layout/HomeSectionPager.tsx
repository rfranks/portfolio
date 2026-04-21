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
import {
  ChevronLeft,
  ChevronRight,
  MoreVert,
  Home as HomeIcon,
  School,
  Work,
  Build,
  AutoStories,
  EmojiEvents,
  Interests,
  AlternateEmail,
} from "@mui/icons-material";

export type HomeSectionPagerItem = {
  id: string;
  label: string;
};

type HomeSectionPagerProps = {
  items: HomeSectionPagerItem[];
  currentSectionId: string;
  onSelectSection: (sectionId: string) => void;
};

const formatSelectedLabel = (index: number, label: string) =>
  `${toRoman(index + 1)}. ${label}`;
const formatOptionLabel = (index: number, label: string) =>
  `${toRoman(index + 1)}. ${label}`;

const getSectionIcon = (sectionId: string) => {
  switch (sectionId) {
    case "hero":
      return <HomeIcon fontSize="small" />;
    case "education":
      return <School fontSize="small" />;
    case "experience":
      return <Work fontSize="small" />;
    case "competencies":
      return <Build fontSize="small" />;
    case "projects":
      return <AutoStories fontSize="small" />;
    case "recognition":
      return <EmojiEvents fontSize="small" />;
    case "hobbies":
      return <Interests fontSize="small" />;
    case "contact":
      return <AlternateEmail fontSize="small" />;
    default:
      return <HomeIcon fontSize="small" />;
  }
};

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
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(
    null,
  );

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

  return (
    <>
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1.25,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "background.paper",
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
            disabled={!previousItem}
            onClick={() => {
              if (previousItem) {
                onSelectSection(previousItem.id);
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Chip
            clickable
            color="primary"
            variant="outlined"
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
              "& .MuiChip-label": {
                width: "100%",
                overflow: "hidden",
                display: "block",
              },
            }}
          />
          <IconButton
            aria-label="Next section"
            size="small"
            disabled={!nextItem}
            onClick={() => {
              if (nextItem) {
                onSelectSection(nextItem.id);
              }
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
            <ListItemIcon sx={{ minWidth: 32 }}>{getSectionIcon(item.id)}</ListItemIcon>
            <ListItemText>{formatOptionLabel(index, item.label)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
