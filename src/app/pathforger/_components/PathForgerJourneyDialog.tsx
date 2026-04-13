import * as React from "react";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import MarkdownContent from "@/components/shared/MarkdownContent";
import {
  type JourneyLedgerField,
  type JourneyTabPanel,
} from "@/app/pathforger/_types/journeyLedger";
import { splitJourneyLedgerValue } from "@/app/pathforger/_utils/journeyLedger";

type PathForgerJourneyDialogProps = {
  open: boolean;
  onClose: () => void;
  pathLedgerMarkdown: string;
  journeyTabPanels: JourneyTabPanel[];
  journeyTabValue: string;
  onJourneyTabValueChange: (nextValue: string) => void;
  activeJourneyPanel: JourneyTabPanel | null;
  journeySnapshotFields: JourneyLedgerField[];
};

export default function PathForgerJourneyDialog(
  props: PathForgerJourneyDialogProps,
) {
  const {
    open,
    onClose,
    pathLedgerMarkdown,
    journeyTabPanels,
    journeyTabValue,
    onJourneyTabValueChange,
    activeJourneyPanel,
    journeySnapshotFields,
  } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={(theme) => ({ zIndex: theme.zIndex.modal + 4 })}
    >
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Box
          sx={(theme) => ({
            fontSize: theme.typography.h6.fontSize,
            fontWeight: theme.typography.h6.fontWeight,
            lineHeight: theme.typography.h6.lineHeight,
          })}
        >
          🧭 Journey Snapshot
        </Box>
        <Typography component="div" variant="body2" color="text.secondary">
          Continuity HUD for your current path.
        </Typography>
      </Box>
      <DialogContent dividers>
        <Box
          sx={{
            maxHeight: { xs: 360, md: 520 },
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {journeyTabPanels.length > 0 ? (
            <Stack spacing={1.25}>
              <Tabs
                value={journeyTabValue}
                onChange={(_event, nextValue: string) =>
                  onJourneyTabValueChange(nextValue)
                }
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}
              >
                {journeyTabPanels.map((panel) => (
                  <Tab
                    key={`journey-tab-${panel.id}`}
                    value={panel.id}
                    label={panel.label}
                    sx={{
                      textTransform: "none",
                      alignItems: "flex-start",
                      minHeight: 40,
                      py: 1,
                    }}
                  />
                ))}
              </Tabs>
              <Box sx={{ p: 1.1 }}>
                {activeJourneyPanel?.kind === "snapshot" ? (
                  <Box sx={{ p: 0.25 }}>
                    <Stack spacing={0.9}>
                      <Typography variant="subtitle2">
                        📌 Chapter, Location, Status
                      </Typography>
                      {journeySnapshotFields.map((field) => {
                        const valueParts = splitJourneyLedgerValue(field.value);

                        return (
                          <Box
                            key={`journey-snapshot-${field.key}`}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              px: 0.9,
                              py: 0.75,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {field.emoji} {field.label}
                            </Typography>
                            {valueParts.length > 1 ? (
                              <Stack
                                direction="row"
                                spacing={0.55}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.35 }}
                              >
                                {valueParts.map((part, index) => (
                                  <Box
                                    key={`${field.key}-snapshot-part-${index}`}
                                    sx={(theme) => ({
                                      px: 0.7,
                                      py: 0.35,
                                      borderRadius: 0.9,
                                      border: "1px solid",
                                      borderColor: alpha(
                                        theme.palette.info.main,
                                        0.4,
                                      ),
                                      backgroundColor: alpha(
                                        theme.palette.background.paper,
                                        0.55,
                                      ),
                                    })}
                                  >
                                    <Typography variant="caption">
                                      {part}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" sx={{ mt: 0.2 }}>
                                {field.value}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ) : null}
                {activeJourneyPanel?.kind === "field"
                  ? (() => {
                      const field = activeJourneyPanel.field;
                      const toneColor =
                        field.tone === "danger"
                          ? "error.main"
                          : field.tone === "warning"
                            ? "warning.main"
                            : field.tone === "positive"
                              ? "success.main"
                              : "info.main";
                      const valueParts = splitJourneyLedgerValue(field.value);

                      return (
                        <Box sx={{ p: 0.25 }}>
                          <Stack spacing={0.8}>
                            <Typography variant="subtitle2">
                              {field.emoji} {field.label}
                            </Typography>
                            {valueParts.length > 1 ? (
                              <Stack
                                direction="row"
                                spacing={0.55}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {valueParts.map((part, index) => (
                                  <Box
                                    key={`${field.key}-part-${index}`}
                                    sx={(theme) => ({
                                      px: 0.7,
                                      py: 0.35,
                                      borderRadius: 0.9,
                                      border: "1px solid",
                                      borderColor: alpha(
                                        theme.palette[
                                          toneColor.split(".")[0] as
                                            | "error"
                                            | "warning"
                                            | "success"
                                            | "info"
                                        ].main,
                                        0.45,
                                      ),
                                      backgroundColor: alpha(
                                        theme.palette.background.paper,
                                        0.55,
                                      ),
                                    })}
                                  >
                                    <Typography variant="caption">
                                      {part}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2">
                                {field.value}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      );
                    })()
                  : null}
                {activeJourneyPanel?.kind === "notes" ? (
                  <Box sx={{ p: 0.25 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 0.8 }}
                    >
                      📎 Additional Notes
                    </Typography>
                    <MarkdownContent
                      content={activeJourneyPanel.content}
                      variant="body2"
                    />
                  </Box>
                ) : null}
              </Box>
            </Stack>
          ) : (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <MarkdownContent content={pathLedgerMarkdown} variant="body1" />
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
