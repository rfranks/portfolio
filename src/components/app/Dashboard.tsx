import { useRef, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import {
  BarChart,
  Menu,
  ChevronLeft,
  DashboardRounded,
  PauseCircle,
  PlayCircleOutline,
  Queue,
  TableChart,
} from "@mui/icons-material";

import SequenceVisualizations from "@/components/dna/SequenceVisualizations";
import SequenceTallies from "@/components/dna/SequenceTallies";
import SequencesTable from "@/components/dna/SequencesTable";
import AddSequenceCard from "@/components/dna/AddSequenceCard";
import { ChartMethod, Sequence } from "@/types/dna/types";

import AppBar from "./AppBar";
import Copyright from "./Copyright";
import Drawer from "./Drawer";

const drawerWidth: number = 240;

export default function Dashboard() {
  const [activeSequences, setActiveSequences] = useState<Sequence[]>([]);
  const [bpRange, setBpRange] = useState<number[] | null>(null);
  const [chartMethod, setChartMethod] = useState<ChartMethod>("sequence");
  const [open, setOpen] = useState<boolean>(true);
  const [openCards, setOpenCards] = useState({
    addSequence: 1,
    table: 1,
    visualizations: 1,
  });
  const [playInterval, setPlayInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [sequences, setSequences] = useState<Record<string, Sequence>>({});

  const playRef = useRef<HTMLButtonElement | null>(null);

  const firstActiveSequence = activeSequences?.[0];
  const maxBasePair = bpRange?.[1] || firstActiveSequence?.sequence.length || 1;

  const sequenceKeys = Object.keys(sequences || {});

  function toggleDrawer() {
    setOpen(!open);
  }

  return (
    <>
      <AppBar
        drawerWidth={drawerWidth}
        position="absolute"
        open={open}
        sx={{ backgroundColor: "#1565c0" }}
      >
        <Toolbar
          sx={{
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
            sx={{ flexGrow: 1 }}
          >
            GeneBoard{" "}
            {`${
              activeSequences.map((seq) => seq?.description).join(", ").length >
              0
                ? " for " +
                  activeSequences.map((seq) => seq?.description).join(", ")
                : ""
            }`}
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
                        firstActiveSequence.sequence.length
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
                      }, 0)
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
                <TextField {...params} label="Active Sequence" />
              )}
              value={activeSequences.map((seq) => {
                return {
                  label: seq?.description || "",
                  id: seq?.description || "",
                };
              })}
              onChange={(
                _,
                newValue: { label: string; id: string }[] | null
              ) => {
                if (newValue) {
                  const ids = newValue?.map((value) => value.id);

                  setBpRange([1, sequences?.[ids[0]]?.sequence.length]);
                  setActiveSequences([
                    ...Object.values(sequences).filter((seq) =>
                      ids.includes(seq.description)
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
          <ListItemButton
            onClick={() =>
              setOpenCards({
                addSequence: 1,
                table: 1,
                visualizations: 1,
              })
            }
          >
            <ListItemIcon>
              <DashboardRounded />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton
            onClick={() =>
              setOpenCards({
                ...openCards,
                addSequence: !openCards.addSequence ? 1 : 0,
              })
            }
            sx={{
              backgroundColor:
                sequenceKeys.length && openCards.addSequence
                  ? "rgba(255, 255, 255, 0.08)"
                  : undefined,
            }}
          >
            <ListItemIcon>
              <Queue />
            </ListItemIcon>
            <ListItemText primary="Add sequences" />
          </ListItemButton>
          <ListItemButton
            disabled={activeSequences?.length === 0}
            onClick={() =>
              setOpenCards({
                ...openCards,
                visualizations: !openCards.visualizations ? 1 : 0,
              })
            }
            sx={{
              backgroundColor:
                sequenceKeys.length && openCards.visualizations
                  ? "rgba(255, 255, 255, 0.08)"
                  : undefined,
            }}
          >
            <ListItemIcon>
              <BarChart />
            </ListItemIcon>
            <ListItemText primary="Visualizations" />
          </ListItemButton>
          <ListItemButton
            disabled={!sequenceKeys.length}
            onClick={() =>
              setOpenCards({
                ...openCards,
                table: !openCards.table ? 1 : 0,
              })
            }
            sx={{
              backgroundColor:
                sequenceKeys.length && openCards.table
                  ? "rgba(255, 255, 255, 0.08)"
                  : undefined,
            }}
          >
            <ListItemIcon>
              <TableChart />
            </ListItemIcon>
            <ListItemText primary="Table" />
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
                      setOpenCards({
                        addSequence: 0,
                        table: 0,
                        visualizations: 1,
                      });

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
          backgroundColor: "#151515",
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3} maxWidth={"calc(100% - 12px)"}>
            {openCards.addSequence === 1 && (
              <Grid item xs={12} sx={{ height: "384px" }}>
                <AddSequenceCard
                  onAddSequence={(seq) => {
                    sequences[seq.description] = seq;

                    setSequences({ [seq.description]: seq, ...sequences });
                  }}
                />
              </Grid>
            )}
            {openCards.table === 1 && sequenceKeys.length > 0 && (
              <Grid item xs={12}>
                <SequencesTable
                  activeSequences={activeSequences}
                  sequences={sequences}
                  onSequenceClick={(seq) => {
                    debugger;
                    setBpRange([1, seq.sequence.length]);

                    setActiveSequences([...activeSequences, seq]);

                    if (
                      activeSequences
                        .map((seq) => seq.description)
                        .includes(seq.description)
                    ) {
                      setActiveSequences([
                        ...activeSequences.filter(
                          (seq) => !sequenceKeys.includes(seq.description)
                        ),
                      ]);
                    }
                  }}
                />
              </Grid>
            )}
            {openCards.visualizations === 1 && activeSequences?.length > 0 && (
              <Grid item xs={12} sx={{ mt: 1, mb: 0 }}>
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
              </Grid>
            )}
          </Grid>
          <Copyright sx={{ pt: 4 }} />
        </Container>
      </Box>
    </>
  );
}
