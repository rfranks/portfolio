"use client";

import * as React from "react";
import {
  Button,
  Card,
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
import CompareOffers from "./offers/CompareOffers";
import OpenAIKeyModal from "@/components/talentforge/OpenAIKeyModal";
import { loadDemoData, clearDemoData } from "@/utils/talentforge/demoData";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import { exportSnapshot, importSnapshot } from "@/utils/talentforge/snapshot";
import { SNAPSHOT_VERSION } from "@/utils/talentforge/dataStore";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";

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
      const data = exportSnapshot();
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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        try {
          importSnapshot(text);
          reloadFromStorage();
          setToastMessage("Snapshot imported");
        } catch {
          setToastMessage("Import failed");
        } finally {
          setToastOpen(true);
        }
      }
    };
    reader.readAsText(file);
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
        <Card>
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
        </Card>

        <Card>
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
      </Card>

      <Card>
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
      </Card>

      <Card>
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
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export or import a snapshot of your stored TalentForge data.
            </Typography>
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
        </Card>

        <Card>
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
        </Card>

        <OpenAIKeyModal open={openKeyModal} onClose={handleCloseModal} />
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

