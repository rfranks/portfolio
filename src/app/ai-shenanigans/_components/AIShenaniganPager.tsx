"use client";

import { type MouseEvent, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { ChevronLeft, ChevronRight, MoreVert, InfoOutlined, Close } from "@mui/icons-material";
import type { AIShenaniganPagerItem } from "../_types/aiShenaniganModels";
import { withBasePath } from "@/utils/basePath";

type AIShenaniganPagerProps = {
  currentIndex: number;
  items: AIShenaniganPagerItem[];
  onNext: () => void;
  onPrevious: () => void;
  onSelectShenanigan: (index: number) => void;
};

const formatPagerOptionLabel = (index: number, title: string) => `${index + 1}. ${title}`;
const formatPagerSelectedLabel = (index: number, title: string) => `${index + 1}. ${title}`;

export default function AIShenaniganPager({
  currentIndex,
  items,
  onNext,
  onPrevious,
  onSelectShenanigan,
}: AIShenaniganPagerProps) {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

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
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto auto",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton aria-label="Previous shenanigan" size="small" onClick={onPrevious}>
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
                {formatPagerSelectedLabel(currentIndex, currentItem.title)}
              </Typography>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "shenanigan-selector-menu" : undefined}
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
          <IconButton aria-label="Next shenanigan" size="small" onClick={onNext}>
            <ChevronRight />
          </IconButton>
          <IconButton
            aria-label="Open shenanigan info"
            size="small"
            onClick={() => setInfoOpen(true)}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Open shenanigan selector"
            size="small"
            onClick={handleSelectorOpen}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? "shenanigan-selector-menu" : undefined}
            sx={{ display: { xs: "none", sm: "none", md: "inline-flex" } }}
          >
            <MoreVert fontSize="small" />
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
              src={withBasePath(item.previewImage)}
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
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          {formatPagerSelectedLabel(currentIndex, currentItem.title)}
          <IconButton
            aria-label="Close shenanigan info"
            onClick={() => setInfoOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentItem.shortText ? (
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {currentItem.shortText}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            {currentItem.blurb}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
