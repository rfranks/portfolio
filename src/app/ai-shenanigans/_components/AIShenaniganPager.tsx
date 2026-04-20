"use client";

import { type MouseEvent, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { summary } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";

type AIShenaniganPagerItem = {
  analyzedImage?: string;
  blurb: string;
  bookCoverImage?: string;
  pagerOptionImage?: string;
  palmLineAnalysisImage?: string;
  rawImage?: string;
  realisticImage?: string;
  shortText?: string;
  slug: string;
  songAlbumImage?: string;
  stylizedRendering?: string;
  title: string;
  type?: string;
};

type AIShenaniganPagerProps = {
  currentIndex: number;
  items: AIShenaniganPagerItem[];
  onNext: () => void;
  onPrevious: () => void;
  onSelectShenanigan: (index: number) => void;
};

const getPagerOptionImage = (item: AIShenaniganPagerItem) => {
  if (item.pagerOptionImage) {
    return item.pagerOptionImage;
  }

  const isDefaultShenanigan = !item.type || item.type === "default";

  if (isDefaultShenanigan && item.stylizedRendering) {
    return item.stylizedRendering;
  }

  return (
    item.bookCoverImage ||
    item.songAlbumImage ||
    item.analyzedImage ||
    item.stylizedRendering ||
    item.realisticImage ||
    item.rawImage ||
    item.palmLineAnalysisImage ||
    summary.avatarImage
  );
};

const formatPagerOptionLabel = (index: number, title: string) =>
  `${index + 1}. ${title}`;
const formatPagerSelectedLabel = (index: number, title: string) =>
  `${index + 1}. ${title}`;

export default function AIShenaniganPager({
  currentIndex,
  items,
  onNext,
  onPrevious,
  onSelectShenanigan,
}: AIShenaniganPagerProps) {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(
    null,
  );

  if (!items.length) {
    return null;
  }

  const currentItem = items[currentIndex];
  const selectorOpen = Boolean(selectorAnchorEl);

  const handleSelectorOpen = (event: MouseEvent<HTMLElement>) => {
    setSelectorAnchorEl(event.currentTarget);
  };

  const handleSelectorClose = () => {
    setSelectorAnchorEl(null);
  };

  const handleSelectShenanigan = (index: number) => {
    onSelectShenanigan(index);
    setSelectorAnchorEl(null);
  };

  return (
    <>
      <Box
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            aria-label="Previous shenanigan"
            size="small"
            onClick={onPrevious}
          >
            <ChevronLeft />
          </IconButton>
          <Chip
            clickable
            color="primary"
            variant="outlined"
            onClick={handleSelectorOpen}
            label={formatPagerSelectedLabel(currentIndex, currentItem.title)}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "shenanigan-selector-menu" : undefined}
            sx={{
              minWidth: 0,
              maxWidth: "100%",
              justifySelf: "stretch",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
          <IconButton aria-label="Next shenanigan" size="small" onClick={onNext}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Menu
        id="shenanigan-selector-menu"
        anchorEl={selectorAnchorEl}
        open={selectorOpen}
        onClose={handleSelectorClose}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 560,
              minWidth: { xs: 340, sm: 480 },
            },
          },
        }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={item.slug}
            selected={index === currentIndex}
            onClick={() => handleSelectShenanigan(index)}
            sx={{
              display: "grid",
              gridTemplateColumns: "69px minmax(0, 1fr)",
              columnGap: 1.65,
              alignItems: "start",
              py: 1.45,
            }}
          >
            <Box
              component="img"
              src={withBasePath(getPagerOptionImage(item))}
              alt={`${item.title} preview`}
              sx={{
                width: 69,
                height: 69,
                mt: 0.2,
                flexShrink: 0,
                borderRadius: 2,
                objectFit: "cover",
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.16rem",
                  lineHeight: 1.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPagerOptionLabel(index, item.title)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mt: 0.25,
                  fontSize: "1rem",
                  lineHeight: 1.3,
                  display: "block",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {item.shortText || item.blurb || "Open this shenanigan."}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
