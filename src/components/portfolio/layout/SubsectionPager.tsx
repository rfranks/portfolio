"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import MoreVert from "@mui/icons-material/MoreVert";
import {
  getPagerIconButtonFrameSx,
  getPagerIconButtonSx,
  getPagerOptionEmojiFontSize,
  getPagerSelectedChipSx,
  getPagerSelectedTextSx,
  PAGER_OVERFLOW_ACTION_DISPLAY_SX,
} from "@/components/portfolio/layout/pagerFoundation";
import {
  getSelectedEmojiAnimationKeyframesSx,
  getSelectedEmojiAnimationTypographySx,
  useResolvedSubsectionPagerEmojiAnimation,
} from "@/components/portfolio/layout/subsection-pager/emojiMotionAdapter";
import {
  formatLabel,
  useSubsectionPagerCore,
} from "@/components/portfolio/layout/subsection-pager/useSubsectionPagerCore";
import {
  getOptionVisualFrameSx,
  getSelectedVisualDisplay,
  getSelectedVisualFrameSx,
  getSelectedVisualSizing,
  resolveSelectedIconFrameStyle,
} from "@/components/portfolio/layout/subsection-pager/visualAdapters";
import type {
  SubsectionPagerItem,
  SubsectionPagerProps,
} from "@/components/portfolio/layout/subsection-pager/types";

export type {
  SubsectionPagerEmojiAnimation,
  SubsectionPagerIconFrameStyle,
  SubsectionPagerItem,
  SubsectionPagerProps,
  SubsectionPagerResolvedEmojiAnimation,
} from "@/components/portfolio/layout/subsection-pager/types";

export default function SubsectionPager({
  items,
  currentKey,
  showOrdinal = true,
  showSelectedVisualOnSmallScreens = false,
  selectedValueAsTitle = false,
  selectedVisualSize = 24,
  selectedIconFontSize,
  selectedEmojiFontSize,
  optionVisualSize: optionVisualSizeProp,
  optionEmojiFontSize: optionEmojiFontSizeProp,
  selectedEmojiAnimation = "none",
  iconFrameStyle = "default",
  selectedIconFrameStyle,
  borderlessIconButtons = false,
  flatIconButtons = false,
  menuId,
  previousAriaLabel,
  nextAriaLabel,
  selectorAriaLabel,
  previousButtonSx,
  disablePrevious = false,
  disableNext = false,
  disableSelector = false,
  onSelect,
  onPrevious,
  onNext,
}: SubsectionPagerProps) {
  const {
    currentIndex,
    currentItem,
    hasMultipleItems,
    selectorAnchorEl,
    selectorOpen,
    handleSelectorOpen,
    handleSelectorClose,
    handleSelect,
    handlePagerKeyDown,
  } = useSubsectionPagerCore({
    items,
    currentKey,
    disablePrevious,
    disableNext,
    disableSelector,
    onSelect,
    onPrevious,
    onNext,
  });

  const animationItemKey = currentItem?.key ?? "__none__";
  const randomAnimationTriggerKey = `${menuId}:${animationItemKey}`;
  const resolvedSelectedEmojiAnimation = useResolvedSubsectionPagerEmojiAnimation(
    selectedEmojiAnimation,
    menuId,
    randomAnimationTriggerKey,
  );

  if (!currentItem || !hasMultipleItems) {
    return null;
  }

  const selectedTitleSource =
    currentItem.selectedTitle ??
    currentItem.optionTitle ??
    currentItem.optionLabel ??
    currentItem.title;
  const selectedTitle = selectedTitleSource?.trim() || currentItem.title;
  const selectedFrameStyle = resolveSelectedIconFrameStyle(selectedIconFrameStyle, iconFrameStyle);
  const selectedImageDisplay = getSelectedVisualDisplay(showSelectedVisualOnSmallScreens, "block");
  const selectedIconDisplay = getSelectedVisualDisplay(
    showSelectedVisualOnSmallScreens,
    "inline-flex",
  );
  const {
    selectedEmojiFontSizeResolved,
    selectedVisualSizeResponsive,
    selectedEmojiMaxFontSizeResponsive,
  } = getSelectedVisualSizing({
    selectedVisualSize,
    selectedEmojiFontSize,
  });
  const selectedEmojiAnimationTypographySx = getSelectedEmojiAnimationTypographySx(
    resolvedSelectedEmojiAnimation,
  );
  const selectedEmojiAnimationKeyframesSx = getSelectedEmojiAnimationKeyframesSx(
    resolvedSelectedEmojiAnimation,
  );

  const optionVisualSize = optionVisualSizeProp ?? 52;
  const optionEmojiFontSizeResolved = getPagerOptionEmojiFontSize({
    optionVisualSize,
    optionEmojiFontSize: optionEmojiFontSizeProp,
  });
  const pagerIconButtonBaseSx = getPagerIconButtonSx({
    selectedValueAsTitle,
    borderlessIconButtons,
    flatIconButtons,
  });
  const pagerIconButtonFrameSx = getPagerIconButtonFrameSx({ selectedValueAsTitle });
  const selectedImageSrc = currentItem.selectedImageSrc ?? currentItem.optionImageSrc;
  const selectedImageAlt =
    currentItem.selectedImageAlt ?? currentItem.optionImageAlt ?? `${currentItem.title} icon`;
  const selectedIcon = currentItem.selectedIcon ?? currentItem.optionIcon;
  const selectedVisual = selectedImageSrc ? (
    <Box
      key={`selected-visual-${currentItem.key}`}
      className="subsection-pager-selected-visual"
      component="img"
      src={selectedImageSrc}
      alt={selectedImageAlt}
      sx={[
        getSelectedVisualFrameSx({
          frameStyle: selectedFrameStyle,
          selectedValueAsTitle,
        }),
        {
          display: selectedImageDisplay,
          width: selectedVisualSizeResponsive,
          height: selectedVisualSizeResponsive,
          objectFit: "contain",
          flexShrink: 0,
          transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
        },
      ]}
    />
  ) : selectedIcon ? (
    <Box
      key={`selected-visual-${currentItem.key}`}
      className="subsection-pager-selected-visual"
      aria-hidden="true"
      sx={[
        getSelectedVisualFrameSx({
          frameStyle: selectedFrameStyle,
          selectedValueAsTitle,
        }),
        {
          display: selectedIconDisplay,
          width: selectedVisualSizeResponsive,
          height: selectedVisualSizeResponsive,
          alignItems: "center",
          justifyContent: "center",
          color: selectedValueAsTitle ? "currentColor" : "text.secondary",
          flexShrink: 0,
          "& .MuiSvgIcon-root": {
            fontSize: {
              xs: "1rem",
              sm: "1.15rem",
              md: selectedIconFontSize ?? "1rem",
            },
          },
          "& .MuiTypography-root": {
            fontSize: {
              xs: `min(${selectedEmojiFontSizeResolved}, ${selectedEmojiMaxFontSizeResponsive.xs})`,
              sm: `min(${selectedEmojiFontSizeResolved}, ${selectedEmojiMaxFontSizeResponsive.sm})`,
              md: `min(${selectedEmojiFontSizeResolved}, ${selectedEmojiMaxFontSizeResponsive.md})`,
            },
            lineHeight: 1,
            ...selectedEmojiAnimationTypographySx,
          },
          ...selectedEmojiAnimationKeyframesSx,
          transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
        },
      ]}
    >
      {selectedIcon}
    </Box>
  ) : null;

  const previousButtonMergedSx: SxProps<Theme> = [
    pagerIconButtonBaseSx,
    pagerIconButtonFrameSx,
    ...(Array.isArray(previousButtonSx)
      ? previousButtonSx
      : previousButtonSx
        ? [previousButtonSx]
        : []),
  ];
  const selectedVisualInteractionSx: SxProps<Theme> = selectedValueAsTitle
    ? {
        "&:hover .subsection-pager-selected-visual": {
          ...(selectedFrameStyle === "none"
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
        "&.Mui-focusVisible .subsection-pager-selected-visual": {
          ...(selectedFrameStyle === "none"
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
    : {};

  return (
    <>
      <Box
        tabIndex={0}
        onKeyDown={handlePagerKeyDown}
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
            disabled={disablePrevious}
            sx={previousButtonMergedSx}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Chip
            clickable
            color="primary"
            variant="outlined"
            onClick={handleSelectorOpen}
            disabled={disableSelector}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.38, sm: 0.55, md: 0.7 },
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {selectedVisual}
                <Typography component="span" sx={getPagerSelectedTextSx({ selectedValueAsTitle })}>
                  {formatLabel(currentIndex, selectedTitle, showOrdinal)}
                </Typography>
              </Box>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={[getPagerSelectedChipSx({ selectedValueAsTitle }), selectedVisualInteractionSx]}
          />
          <IconButton
            size="small"
            aria-label={nextAriaLabel}
            onClick={onNext}
            disabled={disableNext}
            sx={[pagerIconButtonBaseSx, pagerIconButtonFrameSx]}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={selectorAriaLabel}
            size="small"
            onClick={handleSelectorOpen}
            disabled={disableSelector}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={[
              getPagerIconButtonSx({
                selectedValueAsTitle,
                includeRightMargin: true,
                borderlessIconButtons,
                flatIconButtons,
              }),
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
        {items.map((item: SubsectionPagerItem, index: number) => (
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
                sx={[
                  getOptionVisualFrameSx({ frameStyle: iconFrameStyle }),
                  {
                    width: optionVisualSize,
                    height: optionVisualSize,
                    mt: 0.1,
                    objectFit: "contain",
                  },
                ]}
              />
            ) : item.optionIcon ? (
              <Box
                aria-hidden="true"
                sx={[
                  getOptionVisualFrameSx({ frameStyle: iconFrameStyle }),
                  {
                    width: optionVisualSize,
                    height: optionVisualSize,
                    mt: 0.1,
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
                  },
                ]}
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
