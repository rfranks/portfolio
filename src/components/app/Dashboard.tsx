import { useRef, useState } from "react";

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

import {
  AddCircleOutline,
  Menu,
  ChevronLeft,
  DashboardRounded,
  PauseCircle,
  PlayCircleOutline,
} from "@mui/icons-material";

import SequenceVisualizations from "@/components/dna/SequenceVisualizations";
import SequenceTallies from "@/components/dna/SequenceTallies";
import SequencesTable from "@/components/dna/SequencesTable";
import AddSequenceCard from "@/components/dna/AddSequenceCard";
import SequenceAI from "@/components/dna/SequenceAI";
import { ChartMethod, Sequence } from "@/types/dna/types";

import AppBar from "./AppBar";
import Copyright from "./Copyright";
import Drawer from "./Drawer";

const drawerWidth: number = 240;

export interface DashboardProps {
  mode?: PaletteMode;
  toggleColorMode?: () => void;
}

export default function Dashboard({
  mode = "light",
  toggleColorMode,
}: DashboardProps) {
  const [activeSequences, setActiveSequences] = useState<Sequence[]>([]);
  const [bpRange, setBpRange] = useState<number[] | null>(null);
  const [chartMethod, setChartMethod] = useState<ChartMethod>("sequence");
  const [open, setOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "table" | "visualization" | "ai"
  >("table");
  const [isAddSequenceModalOpen, setIsAddSequenceModalOpen] =
    useState<boolean>(false);
  const [playInterval, setPlayInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [sequences, setSequences] = useState<Record<string, Sequence>>({});

  const playRef = useRef<HTMLButtonElement | null>(null);

  const firstActiveSequence = activeSequences?.[0];
  const maxBasePair = bpRange?.[1] || firstActiveSequence?.sequence.length || 1;
  const activeSequenceTitle = activeSequences
    .map((seq) => seq?.description)
    .join(", ");
  const truncatedActiveSequenceTitle =
    activeSequenceTitle.length > 50
      ? `${activeSequenceTitle.slice(0, 47)}...`
      : activeSequenceTitle;

  const sequenceKeys = Object.keys(sequences || {});

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

  function handleDeleteSequence(sequenceToDelete: Sequence) {
    if (playInterval) {
      clearInterval(playInterval);
      setPlayInterval(null);
    }

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
        nextActiveSequences.length > 0
          ? [1, nextActiveSequences[0].sequence.length]
          : null,
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
        sx={{ backgroundColor: "#1565c0" }}
      >
        <Toolbar
          sx={{
            flex: 1,
            pr: "24px", // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: "36px",
              ...(open && { display: "none" }),
            }}
          >
            <Menu />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1, color: "primary.contrastText" }}
          >
            GeneBoard{" "}
            {truncatedActiveSequenceTitle.length > 0
              ? `for ${truncatedActiveSequenceTitle}`
              : ""}
          </Typography>
          {firstActiveSequence && (
            <>
              <IconButton
                ref={playRef}
                color="inherit"
                onClick={() => {
                  if (playInterval) {
                    clearInterval(playInterval);
                    setPlayInterval(null);
                  }
                }}
                disabled={!playInterval}
              >
                <Badge
                  badgeContent={playInterval ? maxBasePair : 0}
                  color="secondary"
                  max={10000}
                >
                  <PauseCircle />
                </Badge>
              </IconButton>
              <IconButton
                ref={playRef}
                color="inherit"
                sx={{
                  display: playInterval ? "none" : undefined,
                }}
                onClick={() => {
                  if (
                    maxBasePair === firstActiveSequence.sequence?.length &&
                    playInterval
                  ) {
                    clearInterval(playInterval);
                    setPlayInterval(null);
                  } else if (playInterval) {
                    setBpRange([
                      1,
                      Math.min(
                        maxBasePair + 10,
                        firstActiveSequence.sequence.length,
                      ),
                    ]);
                  } else {
                    setBpRange([
                      1,
                      Math.min(2, firstActiveSequence.sequence.length),
                    ]);

                    setPlayInterval(
                      setInterval(() => {
                        playRef?.current?.click();
                      }, 0),
                    );
                  }
                }}
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
              sx={{
                width: 600,
                "& .MuiChip-root": {
                  maxWidth: "calc(20% - 6px)",
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Active Sequence"
                  sx={{ backgroundColor: (t) => t.palette.common.white }}
                />
              )}
              value={activeSequences.map((seq) => {
                return {
                  label: seq?.description || "",
                  id: seq?.description || "",
                };
              })}
              onChange={(
                _,
                newValue: { label: string; id: string }[] | null,
              ) => {
                if (newValue) {
                  const ids = newValue?.map((value) => value.id);

                  setBpRange([1, sequences?.[ids[0]]?.sequence.length]);
                  setActiveSequences([
                    ...Object.values(sequences).filter((seq) =>
                      ids.includes(seq.description),
                    ),
                  ]);
                } else {
                  setActiveSequences([]);
                }
              }}
            />
          )}
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" drawerWidth={drawerWidth} open={open}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: [1],
          }}
        >
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
                <Paper
                  sx={{
                    m: 1,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "384px",
                    overflow: "auto",
                  }}
                >
                  <SequenceTallies
                    sequences={sequences}
                    activeSequence={firstActiveSequence}
                    onViewSequenceClick={() => {
                      setActiveTab("visualization");
                      setChartMethod("sequence");
                    }}
                  />
                  <Grid container flexDirection="column">
                    <Grid item>
                      <Link
                        color="primary"
                        href="#"
                        onClick={() => {
                          setSequences({});

                          setActiveSequences([]);
                        }}
                        sx={{ mt: 3 }}
                      >
                        Remove all
                      </Link>
                    </Grid>
                    <Grid item>
                      <Link
                        color="primary"
                        href="#"
                        onClick={() => {
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
                        sx={{ mt: 3 }}
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
        sx={{
          backgroundColor: "rgba(25, 118, 210, 0.08)",
          flexGrow: 1,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar />
        <Container
          maxWidth="lg"
          sx={{
            px: 2,
            my: 2,
            flex: 1,
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr) auto",
            rowGap: 3,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Paper
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value: "table" | "visualization" | "ai") =>
                setActiveTab(value)
              }
              aria-label="gene dashboard tabs"
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
          </Paper>
          <Box
            sx={{
              minHeight: 0,
              overflowY: activeTab === "visualization" ? "hidden" : "auto",
              overflowX: "hidden",
            }}
          >
            <Grid
              container
              spacing={3}
              sx={{
                minHeight: activeTab === "visualization" ? "100%" : "auto",
                overflow: activeTab === "visualization" ? "hidden" : "visible",
              }}
            >
              {activeTab === "table" && (
                <Grid item xs={12}>
                  {sequenceKeys.length > 0 ? (
                    <SequencesTable
                      activeSequences={activeSequences}
                      sequences={sequences}
                      onSequenceClick={(seq) => {
                        setBpRange([1, seq.sequence.length]);

                        setActiveSequences([...activeSequences, seq]);

                        if (
                          activeSequences
                            .map((seq) => seq.description)
                            .includes(seq.description)
                        ) {
                          setActiveSequences([
                            ...activeSequences.filter(
                              (activeSequence) =>
                                activeSequence.description !== seq.description,
                            ),
                          ]);
                        }
                      }}
                      onSequenceDelete={handleDeleteSequence}
                    />
                  ) : (
                    <Paper sx={{ p: 4 }}>
                      <Typography color="text.secondary">
                        No sequences added yet. Use Add to open the add sequence
                        modal.
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              )}
              {activeTab === "visualization" && (
                <Grid
                  item
                  xs={12}
                  sx={{
                    mt: 1,
                    mb: 0,
                    display: "flex",
                    minHeight: 0,
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
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
                    <Paper sx={{ p: 4 }}>
                      <Typography color="text.secondary">
                        Select one or more sequences from the table to view
                        visualizations.
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              )}
              {activeTab === "ai" && (
                <Grid
                  item
                  xs={12}
                  sx={{
                    mt: 1,
                    mb: 0,
                    display: "flex",
                    minWidth: 0,
                    overflow: "visible",
                    alignItems: "flex-start",
                  }}
                >
                  <SequenceAI
                    activeSequences={activeSequences}
                    sequences={sequences}
                  />
                </Grid>
              )}
            </Grid>
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
