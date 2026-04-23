"use client";

import Close from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";

type MediaMetadataShellProps = {
  item: MediaCyclerItem | null;
  smallScreenInfoBlurb?: string;
  onClose: (trigger: PortfolioTelemetryTrigger, control?: string) => void;
};

export default function MediaMetadataShell({
  item,
  smallScreenInfoBlurb,
  onClose,
}: MediaMetadataShellProps) {
  return (
    <Dialog
      open={Boolean(item)}
      onClose={() => onClose("programmatic", "metadata-dialog-close")}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ pr: 6 }}>
        {item?.mediaLightboxTitle || item?.title || "Media details"}
        <IconButton
          aria-label="Close media details"
          onClick={() => onClose("pointer", "close-media-details")}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {smallScreenInfoBlurb?.trim() ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: item?.mediaSource || item?.mediaCaption ? 1.25 : 0,
            }}
          >
            {smallScreenInfoBlurb}
          </Typography>
        ) : null}
        {item?.mediaSource ? (
          <Typography variant="body2" color="text.secondary">
            Source:{" "}
            {item.mediaSourceHref ? (
              <Link
                href={item.mediaSourceHref}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="primary.main"
              >
                {item.mediaSource}
              </Link>
            ) : (
              item.mediaSource
            )}
          </Typography>
        ) : null}
        {item?.mediaCaption ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: item.mediaSource ? 1.25 : 0 }}
          >
            {item.mediaCaption}
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
