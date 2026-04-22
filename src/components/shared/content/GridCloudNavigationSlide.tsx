import type { ReactNode } from "react";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import GridView from "@mui/icons-material/GridView";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export interface GridCloudNavigationSlideProps {
  viewMode: "cloud" | "list";
  onViewModeChange: (nextCloudView: boolean) => void;
  listContent: ReactNode;
  cloudContent: ReactNode;
  isMdUp?: boolean;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  showFooterOnMobile?: boolean;
  showViewToggle?: boolean;
  rootSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
  listViewAriaLabel?: string;
  cloudViewAriaLabel?: string;
}

const mergeSx = (base: SxProps<Theme>, override?: SxProps<Theme>): SxProps<Theme> =>
  (override ? [base, override] : base) as SxProps<Theme>;

export default function GridCloudNavigationSlide({
  viewMode,
  onViewModeChange,
  listContent,
  cloudContent,
  isMdUp = true,
  footerStart,
  footerEnd,
  showFooterOnMobile = false,
  showViewToggle = true,
  rootSx,
  contentSx,
  footerSx,
  listViewAriaLabel = "Show list view",
  cloudViewAriaLabel = "Show panel view",
}: GridCloudNavigationSlideProps) {
  const isCloudView = viewMode === "cloud";
  const shouldRenderViewToggle = showViewToggle && (isMdUp || showFooterOnMobile);
  const shouldRenderFooter = shouldRenderViewToggle || Boolean(footerStart || footerEnd);

  return (
    <Box
      sx={mergeSx(
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        rootSx,
      )}
    >
      <Box
        sx={mergeSx(
          {
            minHeight: 0,
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
          contentSx,
        )}
      >
        {isCloudView ? cloudContent : listContent}
      </Box>
      {shouldRenderFooter ? (
        <Box
          sx={mergeSx(
            {
              py: 1.25,
              minHeight: "fit-content",
              display: "flex",
              alignItems: "center",
              justifyContent: footerStart || footerEnd ? "space-between" : "center",
              gap: 1,
              flexWrap: "wrap",
            },
            footerSx,
          )}
        >
          {footerStart ? (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>{footerStart}</Box>
          ) : null}
          {shouldRenderViewToggle ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                View
              </Typography>
              <IconButton
                size="small"
                aria-label={listViewAriaLabel}
                onClick={() => onViewModeChange(false)}
                sx={{ p: 0.35 }}
              >
                <FormatListBulleted fontSize="small" color={isCloudView ? "disabled" : "primary"} />
              </IconButton>
              <Switch
                checked={isCloudView}
                onChange={(event) => onViewModeChange(event.target.checked)}
                inputProps={{ "aria-label": "Toggle view mode" }}
                color="primary"
                size="small"
              />
              <IconButton
                size="small"
                aria-label={cloudViewAriaLabel}
                onClick={() => onViewModeChange(true)}
                sx={{ p: 0.35 }}
              >
                <GridView fontSize="small" color={isCloudView ? "primary" : "disabled"} />
              </IconButton>
            </Stack>
          ) : (
            <Box />
          )}
          {footerEnd ? (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>{footerEnd}</Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
