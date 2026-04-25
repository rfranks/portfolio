import { useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { PaletteMode } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  AddCircleOutline,
  Menu,
  ChevronLeft,
  DashboardRounded,
  PauseCircle,
  PlayCircleOutline,
} from "@mui/icons-material";

import SequenceVisualizations from "./SequenceVisualizations";
import SequenceTallies from "./SequenceTallies";
import SequencesTable from "./SequencesTable";
import AddSequenceCard from "./AddSequenceCard";
import SequenceAI from "./SequenceAI";
import { ChartMethod, Sequence } from "../_types/types";
import { useSequencePlaybackLoop } from "../_hooks/useSequencePlaybackLoop";
import { withBasePath } from "@/utils/basePath";
import AppBar from "@/components/portfolio/layout/AppBar";
import Drawer from "@/components/portfolio/layout/Drawer";
import Copyright from "@/components/portfolio/layout/Copyright";

const drawerWidth: number = 240;

export interface DashboardProps {
  mode?: PaletteMode;
  toggleColorMode?: () => void;
}

export default function Dashboard({ mode = "dark", toggleColorMode }: DashboardProps) {
  const [activeSequences, setActiveSequences] = useState<Sequence[]>([]);
  const [bpRange, setBpRange] = useState<number[] | null>(null);
  const [chartMethod, setChartMethod] = useState<ChartMethod>("sequence");
  const [open, setOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"table" | "visualization" | "ai">("table");
  const [isAddSequenceModalOpen, setIsAddSequenceModalOpen] = useState<boolean>(false);
  const [sequences, setSequences] = useState<Record<string, Sequence>>({});

  const firstActiveSequence = activeSequences?.[0];
  const maxBasePair = bpRange?.[1] || firstActiveSequence?.sequence.length || 1;
  const activeSequenceTitle = activeSequences.map((seq) => seq?.description).join(", ");
  const truncatedActiveSequenceTitle =
    activeSequenceTitle.length > 50
      ? `${activeSequenceTitle.slice(0, 47)}...`
      : activeSequenceTitle;

  const sequenceKeys = Object.keys(sequences || {});
  const { isPlaying, startPlayback, stopPlayback } = useSequencePlaybackLoop({
    sequenceLength: firstActiveSequence?.sequence.length || 0,
    bpRange,
    onBpRangeUpdate: (nextBpRange) => setBpRange(nextBpRange),
  });

  function toggleDrawer() {
    setOpen(!open);
  }

  function handleAddSequence(sequence: Sequence) {
    setSequences((currentSequences) => ({
      [sequence.description]: sequence,
      ...currentSequences,
    }));
    setIsAddSequenceModalOpen(false);
  }

  function getUniqueSequenceLabel(existingLabels: string[], baseLabel: string): string {
    if (!existingLabels.includes(baseLabel)) {
      return baseLabel;
    }

    let copyIndex = 2;
    let nextLabel = `${baseLabel} (${copyIndex})`;

    while (existingLabels.includes(nextLabel)) {
      copyIndex += 1;
      nextLabel = `${baseLabel} (${copyIndex})`;
    }

    return nextLabel;
  }

  function handleCopySequence(sequenceToCopy: Sequence) {
    setSequences((currentSequences) => {
      const existingDescriptions = Object.keys(currentSequences);
      const copiedDescription = getUniqueSequenceLabel(
        existingDescriptions,
        `${sequenceToCopy.description} (copy)`,
      );
      const copiedFilename = getUniqueSequenceLabel(
        Object.values(currentSequences).map((sequence) => sequence.filename),
        `${sequenceToCopy.filename} (copy)`,
      );

      return {
        [copiedDescription]: {
          ...sequenceToCopy,
          description: copiedDescription,
          filename: copiedFilename,
        },
        ...currentSequences,
      };
    });
  }

  function handleDeleteSequence(sequenceToDelete: Sequence) {
    stopPlayback();

    setSequences((currentSequences) => {
      const nextSequences = { ...currentSequences };
      delete nextSequences[sequenceToDelete.description];
      return nextSequences;
    });

    setActiveSequences((currentActiveSequences) => {
      const nextActiveSequences = currentActiveSequences.filter(
        (sequence) => sequence.description !== sequenceToDelete.description,
      );

      setBpRange(
        nextActiveSequences.length > 0 ? [1, nextActiveSequences[0].sequence.length] : null,
      );

      return nextActiveSequences;
    });
  }

  return (
    <>
      <AppBar
        drawerWidth={drawerWidth}
        position="absolute"
        open={open}
        mode={mode}
        toggleColorMode={toggleColorMode}
        sx={(theme) => ({
          backgroundColor:
            theme.palette.mode === "dark"
              ? "var(--dna-surface-2)"
              : alpha(theme.palette.common.white, 0.94),
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(
                  theme.palette.primary.main,
                  0.16,
                )}, transparent 72%)`
              : `linear-gradient(180deg, ${alpha(
                  theme.palette.primary.light,
                  0.14,
                )}, transparent 72%)`,
          color: "text.primary",
          borderBottom: "1px solid var(--dna-surface-border)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "var(--dna-shadow-tight)"
              : "0 10px 24px rgba(21, 101, 192, 0.08)",
          backdropFilter: "blur(18px)",
        })}
      >
        <Toolbar className="flex-1 pr-6">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            className={open ? "hidden" : "mr-9"}
          >
            <Menu />
          </IconButton>
          <Box className="flex min-w-0 flex-1 items-center gap-4">
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--dna-surface-border)",
                boxShadow: "none",
                px: 1.5,
                py: 0.75,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={withBasePath("/apps/dna/images/geneboard_banner.png")}
                alt="GeneBoard"
                sx={{
                  display: "block",
                  height: { xs: 28, sm: 32 },
                  width: "auto",
                  maxWidth: "100%",
                }}
              />
            </Paper>
            {truncatedActiveSequenceTitle.length > 0 ? (
              <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ minWidth: 0 }}>
                {`for ${truncatedActiveSequenceTitle}`}
              </Typography>
            ) : null}
          </Box>
          {firstActiveSequence && (
            <>
              <IconButton
                color="inherit"
                onClick={() => {
                  stopPlayback();
                }}
                disabled={!isPlaying}
              >
                <Badge badgeContent={isPlaying ? maxBasePair : 0} color="secondary" max={10000}>
                  <PauseCircle />
                </Badge>
              </IconButton>
              <IconButton
                color="inherit"
                sx={{
                  display: isPlaying ? "none" : undefined,
                }}
                onClick={startPlayback}
              >
                <Badge badgeContent={0} color="secondary">
                  <PlayCircleOutline />
                </Badge>
              </IconButton>
            </>
          )}
          {sequenceKeys.length > 0 && (
            <Autocomplete
              id="gene-select-autocomplete"
              disablePortal
              multiple
              limitTags={4}
              options={sequenceKeys.sort().map((key) => {
                const seq = sequences?.[key];

                return {
                  label: seq.description,
                  id: seq.description,
                };
              })}
              className="w-full max-w-[600px]"
              sx={{
                "& .MuiChip-root": {
                  maxWidth: "calc(20% - 6px)",
                },
              }}
              renderInput={(params) => <TextField {...params} label="Active Sequence" />}
              value={activeSequences.map((seq) => {
                return {
                  label: seq?.description || "",
                  id: seq?.description || "",
                };
              })}
              onChange={(_, newValue: { label: string; id: string }[] | null) => {
                stopPlayback();
                if (newValue) {
                  const ids = newValue?.map((value) => value.id);

                  setBpRange([1, sequences?.[ids[0]]?.sequence.length]);
                  setActiveSequences([
                    ...Object.values(sequences).filter((seq) => ids.includes(seq.description)),
                  ]);
                } else {
                  setActiveSequences([]);
                }
              }}
            />
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        drawerWidth={drawerWidth}
        open={open}
        sx={{
          "& .MuiDrawer-paper": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "var(--dna-surface-2)"
                : alpha(theme.palette.common.white, 0.95),
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? `linear-gradient(180deg, ${alpha(
                    theme.palette.primary.main,
                    0.12,
                  )}, transparent 84%)`
                : `linear-gradient(180deg, ${alpha(
                    theme.palette.primary.light,
                    0.12,
                  )}, transparent 84%)`,
            borderRight: "1px solid var(--dna-surface-border-strong)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "var(--dna-shadow-tight)"
                : "0 12px 28px rgba(21, 101, 192, 0.09)",
            color: "text.primary",
          },
        }}
      >
        <Toolbar className="flex items-center justify-end px-1">
          <IconButton onClick={toggleDrawer}>
            <ChevronLeft />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          <ListItemButton selected>
            <ListItemIcon>
              <DashboardRounded />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          {open && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem>
                <Paper className="mx-2 flex h-96 flex-col overflow-auto p-4 flex-grow">
                  <SequenceTallies
                    sequences={sequences}
                    activeSequence={firstActiveSequence}
                    onViewSequenceClick={() => {
                      setActiveTab("visualization");
                      setChartMethod("sequence");
                    }}
                  />
                  <Grid container flexDirection="column" className="mt-3">
                    <Grid item>
                      <Link
                        color="primary"
                        href="#"
                        onClick={() => {
                          stopPlayback();
                          setSequences({});

                          setActiveSequences([]);
                        }}
                      >
                        Remove all
                      </Link>
                    </Grid>
                    <Grid item>
                      <Link
                        color="primary"
                        href="#"
                        onClick={() => {
                          stopPlayback();
                          Object.keys(sequences).forEach((key) => {
                            if (sequences[key] && sequences[key].hasAmbiguous) {
                              delete sequences[key];
                            }
                          });

                          setSequences({
                            ...sequences,
                          });

                          setActiveSequences([]);
                        }}
                      >
                        Clear errors
                      </Link>
                    </Grid>
                  </Grid>
                </Paper>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
      <Box
        component="main"
        className="flex h-screen flex-1 flex-col overflow-hidden"
        sx={(theme) => ({
          backgroundColor: theme.palette.background.default,
          backgroundImage:
            theme.palette.mode === "dark"
              ? `radial-gradient(circle at top, ${alpha(
                  theme.palette.primary.main,
                  0.18,
                )}, transparent 52%)`
              : `radial-gradient(circle at top, ${alpha(
                  theme.palette.primary.light,
                  0.16,
                )}, transparent 48%)`,
        })}
      >
        <Toolbar />
        <Container
          maxWidth="lg"
          className="my-2 flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-2"
        >
          <Container className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-1">
            <Tabs
              value={activeTab}
              onChange={(_, value: "table" | "visualization" | "ai") => setActiveTab(value)}
              aria-label="gene dashboard tabs"
              sx={{
                minHeight: 40,
                "& .MuiTab-root": {
                  minHeight: 40,
                  py: 0.5,
                },
              }}
            >
              <Tab label="Table" value="table" />
              <Tab label="Visualization" value="visualization" />
              <Tab label="AI" value="ai" />
            </Tabs>
            <Button
              variant="contained"
              startIcon={<AddCircleOutline />}
              onClick={() => setIsAddSequenceModalOpen(true)}
            >
              Add
            </Button>
          </Container>
          <Box
            className="min-h-0 flex-1 overflow-x-hidden"
            sx={{ overflowY: activeTab === "ai" ? "auto" : "hidden" }}
          >
            {activeTab === "table" && (
              <Grid container spacing={3} className="h-full">
                <Grid item xs={12}>
                  {sequenceKeys.length > 0 ? (
                    <SequencesTable
                      activeSequences={activeSequences}
                      sequences={sequences}
                      onSequenceClick={(seq) => {
                        setBpRange([1, seq.sequence.length]);

                        setActiveSequences([...activeSequences, seq]);

                        if (
                          activeSequences.map((seq) => seq.description).includes(seq.description)
                        ) {
                          setActiveSequences([
                            ...activeSequences.filter(
                              (activeSequence) => activeSequence.description !== seq.description,
                            ),
                          ]);
                        }
                      }}
                      onSequenceCopy={handleCopySequence}
                      onSequenceDelete={handleDeleteSequence}
                    />
                  ) : (
                    <Paper className="p-4 sm:p-6">
                      <Typography color="text.secondary">
                        No sequences added yet. Use Add to open the add sequence modal.
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            )}
            {activeTab === "visualization" && (
              <Box className="flex h-full min-h-full max-h-full min-w-0 overflow-hidden">
                {activeSequences?.length > 0 ? (
                  <SequenceVisualizations
                    activeSequences={activeSequences}
                    bpRange={bpRange}
                    onBpRangeUpdate={(bpRange) => setBpRange(bpRange)}
                    chartMethod={chartMethod}
                    onChartMethodUpdate={function (chartMethod) {
                      setChartMethod(chartMethod);
                      setBpRange([1, firstActiveSequence?.sequence?.length]);
                    }}
                  />
                ) : (
                  <Paper className="w-full p-4 sm:p-6">
                    <Typography color="text.secondary">
                      Select one or more sequences from the table to view visualizations.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
            {activeTab === "ai" && (
              <Box className="flex min-w-0 items-start overflow-visible">
                <SequenceAI activeSequences={activeSequences} sequences={sequences} />
              </Box>
            )}
          </Box>
          <Copyright sx={{ pt: 4, mt: "auto" }} />
        </Container>
      </Box>
      <Dialog
        open={isAddSequenceModalOpen}
        onClose={() => setIsAddSequenceModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <AddSequenceCard
          onAddSequence={handleAddSequence}
          onClose={() => setIsAddSequenceModalOpen(false)}
        />
      </Dialog>
    </>
  );
}
