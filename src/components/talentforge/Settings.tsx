"use client";

import * as React from "react";
import {
  Button,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import CompareOffers from "./Offers/CompareOffers";
import OpenAIKeyModal from "@/components/talentforge/OpenAIKeyModal";
import { loadDemoData, clearDemoData } from "@/utils/talentforge/demoData";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import { exportSnapshot, importSnapshot } from "@/utils/talentforge/snapshot";
import type { SnapshotMetadata } from "@/utils/talentforge/snapshot";
import { SNAPSHOT_VERSION, APP_VERSION } from "@/utils/talentforge/dataStore";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import { Hero, Panel } from "@/components/fabric";

type SnapshotPreviewMetadata = Partial<SnapshotMetadata> & { version?: number };

interface PendingSnapshotImport {
  json: string;
  fileName: string;
  metadata: SnapshotPreviewMetadata;
}

const extractSnapshotMetadata = (value: unknown): SnapshotPreviewMetadata => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const record = value as Record<string, unknown>;
  const metadata: SnapshotPreviewMetadata = {};
  if (typeof record.version === "number") {
    metadata.version = record.version;
  }
  if (typeof record.exportedAt === "string") {
    metadata.exportedAt = record.exportedAt;
  }
  if (typeof record.appVersion === "string") {
    metadata.appVersion = record.appVersion;
  }
  if (typeof record.notes === "string") {
    metadata.notes = record.notes;
  }
  return metadata;
};

const formatMetadataDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

export default function Settings() {
  const dataStore = useTalentForgeData();
  const [openKeyModal, setOpenKeyModal] = React.useState(false);
  const [comp, setComp] = React.useState({
    salary: "",
    benefits: "",
    stock: "",
  });
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [exportNotes, setExportNotes] = React.useState("");
  const [pendingImport, setPendingImport] = React.useState<PendingSnapshotImport | null>(
    null,
  );
  const { hasKey, clearKey, reloadFromStorage } = useOpenAIKey();

  const offers = dataStore.getOffers();
  const hasMultipleOffers = offers.length >= 2;

  React.useEffect(() => {
    if (!hasMultipleOffers && compareOpen) {
      setCompareOpen(false);
    }
  }, [hasMultipleOffers, compareOpen]);

  React.useEffect(() => {
    setComp(dataStore.getCurrentCompensation());
  }, [dataStore]);

  const handleRemoveKey = () => {
    clearKey();
  };

  const handleExport = () => {
    try {
      const data = exportSnapshot({ notes: exportNotes });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `talentforge-snapshot-v${SNAPSHOT_VERSION}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMessage("Snapshot exported");
      setToastOpen(true);
    } catch {
      setToastMessage("Export failed");
      setToastOpen(true);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        try {
          const parsed = JSON.parse(text);
          const metadata = extractSnapshotMetadata(parsed);
          setPendingImport({
            json: text,
            fileName: file.name,
            metadata,
          });
        } catch {
          setToastMessage("Unable to parse snapshot file");
          setToastOpen(true);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    try {
      importSnapshot(pendingImport.json);
      reloadFromStorage();
      setToastMessage("Snapshot imported");
    } catch {
      setToastMessage("Import failed");
    } finally {
      setToastOpen(true);
      setPendingImport(null);
    }
  };

  const handleCancelImport = () => {
    setPendingImport(null);
  };

  const handleCloseModal = () => {
    setOpenKeyModal(false);
  };

  const handleLoadDemo = () => {
    loadDemoData();
  };

  const handleClearDemo = () => {
    clearDemoData();
  };

  const handleCompChange = (field: "salary" | "benefits" | "stock") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setComp((c) => ({ ...c, [field]: e.target.value }));
    };
  const handleSaveComp = () => {
    dataStore.saveCurrentCompensation(comp);
  };
  const compHasValue = Object.values(comp).some((v) => v.trim() !== "");

  return (
    <ErrorBoundary>
      <Stack spacing={4}>
        <Hero>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
          <Typography color="text.secondary">
            Configure AI access, compare offers, and manage your local TalentForge data.
          </Typography>
        </Hero>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              OpenAI API Key
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasKey ? "A key is currently stored." : "No key has been set."}
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={() => setOpenKeyModal(true)}>
              {hasKey ? "Update Key" : "Set Key"}
            </Button>
            {hasKey && <Button onClick={handleRemoveKey}>Remove Key</Button>}
          </CardActions>
        </Panel>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Compensation
            </Typography>
            <Stack spacing={2} aria-label="Update current compensation">
              <Typography variant="body2" color="text.secondary">
                This information is only used to negotiate better offers on your behalf and compare them against your current compensation.
              </Typography>
              <TextField
                label="Current Salary"
                value={comp.salary}
                onChange={handleCompChange("salary")}
                inputProps={{ "aria-label": "Current salary" }}
              />
              <TextField
                label="Benefits"
                value={comp.benefits}
                onChange={handleCompChange("benefits")}
                inputProps={{ "aria-label": "Benefits" }}
              />
              <TextField
                label="Stock Options / RSUs"
                value={comp.stock}
                onChange={handleCompChange("stock")}
                inputProps={{ "aria-label": "Stock options and RSUs" }}
              />
            </Stack>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={handleSaveComp} disabled={!compHasValue}>
              Save
            </Button>
          </CardActions>
        </Panel>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Compare Offers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select two saved offers to review them side by side and generate an AI analysis.
            </Typography>
          </CardContent>
          <CardActions sx={{ gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              onClick={() => setCompareOpen(true)}
              disabled={!hasMultipleOffers}
            >
              Compare Offers
            </Button>
            {!hasMultipleOffers && (
              <Typography variant="caption" color="text.secondary">
                Save at least two offers to enable comparison.
              </Typography>
            )}
          </CardActions>
        </Panel>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connectors
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="LinkedIn" secondary="Configuration coming soon" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Indeed" secondary="Configuration coming soon" />
              </ListItem>
            </List>
          </CardContent>
        </Panel>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export or import a snapshot of your stored TalentForge data.
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Export metadata
                </Typography>
                <List dense disablePadding>
                  <ListItem disablePadding>
                    <ListItemText primary="App Version" secondary={APP_VERSION} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Snapshot Version"
                      secondary={SNAPSHOT_VERSION.toString()}
                    />
                  </ListItem>
                </List>
              </div>
              <TextField
                label="Export Notes (optional)"
                value={exportNotes}
                onChange={(event) => setExportNotes(event.target.value)}
                placeholder="Add context about this snapshot"
                multiline
                minRows={2}
                inputProps={{ "aria-label": "Export notes" }}
              />
            </Stack>
          </CardContent>
          <CardActions>
            <Button onClick={handleExport} variant="contained">
              Export Snapshot
            </Button>
            <Button component="label">
              Import Snapshot
              <input type="file" accept="application/json" hidden onChange={handleImport} />
            </Button>
          </CardActions>
        </Panel>

        <Panel>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demo Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Load sample resumes and job applications for exploration.
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={handleLoadDemo}>
              Load Demo Data
            </Button>
            <Button onClick={handleClearDemo}>Clear Demo Data</Button>
          </CardActions>
        </Panel>

        <OpenAIKeyModal open={openKeyModal} onClose={handleCloseModal} />
        <Dialog
          open={Boolean(pendingImport)}
          onClose={handleCancelImport}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Import Snapshot</DialogTitle>
          <DialogContent dividers>
            {pendingImport ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Review the snapshot metadata before importing.
                </Typography>
                <Typography variant="subtitle2">Selected file</Typography>
                <Typography>{pendingImport.fileName}</Typography>
                {(() => {
                  const metadata = pendingImport.metadata;
                  const details = [
                    {
                      label: "App Version",
                      value: metadata.appVersion,
                    },
                    {
                      label: "Snapshot Version",
                      value:
                        typeof metadata.version === "number"
                          ? metadata.version.toString()
                          : undefined,
                    },
                    {
                      label: "Exported At",
                      value: metadata.exportedAt
                        ? formatMetadataDate(metadata.exportedAt)
                        : undefined,
                    },
                  ];
                  const hasDetails =
                    details.some((item) => Boolean(item.value)) ||
                    Boolean(metadata.notes && metadata.notes.trim().length > 0);
                  if (!hasDetails) {
                    return (
                      <Typography variant="body2">
                        This snapshot does not include metadata.
                      </Typography>
                    );
                  }
                  return (
                    <List dense>
                      {details.map((item) =>
                        item.value ? (
                          <ListItem key={item.label} disablePadding>
                            <ListItemText primary={item.label} secondary={item.value} />
                          </ListItem>
                        ) : null,
                      )}
                      {metadata.notes ? (
                        <ListItem disablePadding>
                          <ListItemText primary="Notes" secondary={metadata.notes} />
                        </ListItem>
                      ) : null}
                    </List>
                  );
                })()}
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelImport}>Cancel</Button>
            <Button
              onClick={handleConfirmImport}
              variant="contained"
              disabled={!pendingImport}
            >
              Import Snapshot
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle>Compare Offers</DialogTitle>
          <DialogContent dividers>
            <CompareOffers />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompareOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          message={toastMessage}
          onClose={() => setToastOpen(false)}
        />
      </Stack>
    </ErrorBoundary>
  );
}
