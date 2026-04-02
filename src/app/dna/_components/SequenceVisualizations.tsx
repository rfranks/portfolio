import { useState } from "react";

import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Paper from "@mui/material/Paper";
import SequenceDisplay from "./SequenceDisplay";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Slider from "@mui/material/Slider";

import {
  Brush,
  ChatBubble,
  ContentCopy,
  FontDownload,
  FontDownloadOff,
  Numbers,
  Share,
} from "@mui/icons-material";

import {
  BasepairHistogram,
  GatesChart,
  QiChart,
  RandicChart,
  SquiggleChart,
} from "./charts";
import Title from "@/components/shared/Title";
import { ChartMethod, Sequence } from "../_types/types";

export type SequenceVisualizationsProps = {
  activeSequences?: Sequence[] | null;
  bpRange?: number[] | null;
  onBpRangeUpdate?: (bpRange: number[]) => void;
  chartMethod?: ChartMethod | null;
  onChartMethodUpdate?: (chartMethod: ChartMethod) => void;
};

export default function SequenceVisualizations({
  activeSequences = [],
  bpRange = [],
  chartMethod = "sequence",
  onBpRangeUpdate,
  onChartMethodUpdate,
}: SequenceVisualizationsProps) {
  const minBasePair = bpRange?.[0] || 1;
  const maxBasePair =
    bpRange?.[1] || activeSequences?.[0]?.sequence?.length || 1;

  const [colorizeSequence, setColorizeSequence] = useState<boolean>(true);
  const [displaySequenceText, setDisplaySequenceText] = useState<boolean>(true);
  const [displayTooltip, setDisplayTooltip] = useState<boolean>(true);
  const [displayBinary, setDisplayBinary] = useState<boolean>(false);
  const [showProteins, setShowProteins] = useState<boolean>(false);

  const activeSequence = activeSequences?.[0];
  const isSequenceChart = chartMethod === "sequence";

  const getChartMethodTitle = (chartMethod?: ChartMethod | null): string => {
    switch (chartMethod) {
      case "bpcontent":
        return "Basepair Content Histograms";
      case "squiggle":
        return (activeSequences?.length || 0) > 1
          ? "Squiggle Charts"
          : "Squiggle Chart";
      case "gates":
        return "Gates Chart";
      case "qi":
        return "Qi Chart";
      case "sequence":
        return (activeSequences?.length || 0) > 1 ? "Sequences" : "Sequence";
      case "randic":
        return (activeSequences?.length || 0) > 1
          ? "Randic Charts"
          : "Randic Chart";
      default:
        return "";
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        flex: 1,
        minWidth: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "background.paper",
          flexShrink: 0,
          pb: 1,
        }}
      >
        <Grid container>
          <Grid item>
            <Box sx={{ maxWidth: "800px", pt: 1 }}>
              <Title sx={{ color: "primary.main" }}>
                {getChartMethodTitle(chartMethod)}
                {`${
                  activeSequences
                    ?.map((sequence) => sequence.description)
                    .join(", ").length
                    ? (chartMethod !== "" ? " for " : "") +
                      activeSequences
                        ?.map((sequence) => sequence.description)
                        ?.sort()
                        .join(", ")
                    : ""
                }`}
              </Title>
            </Box>
          </Grid>
          <Grid item sx={{ flexGrow: 1, textAlign: "right" }}>
            <FormControl
              sx={{ m: 1, minWidth: 120, maxWidth: 360 }}
              size="small"
            >
              <InputLabel id="chart-select-label">Visualization</InputLabel>
              <Select
                labelId="chart-select-label"
                id="chart-select"
                value={chartMethod || ""}
                label="Chart Method"
                onChange={function (e: SelectChangeEvent) {
                  onChartMethodUpdate?.(e.target.value as ChartMethod);
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"bpcontent"}>basepair content</MenuItem>
                <MenuItem value={"sequence"}>sequence</MenuItem>
                <MenuItem value={"squiggle"}>squiggle</MenuItem>
                <MenuItem value={"gates"}>gates</MenuItem>
                <MenuItem value={"qi"}>qi</MenuItem>
                <MenuItem value={"randic"}>randic</MenuItem>
                <MenuItem value={"yau"}>yau</MenuItem>
                <MenuItem value={"yau_bp"}>yau_bp</MenuItem>
                <MenuItem value={"yau_int"}>yau_int</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, pl: 1, width: "100%" }}>
              <Slider
                min={1}
                max={activeSequence?.sequence.length || 1}
                step={3}
                getAriaLabel={() => "basepair(bp) range"}
                value={bpRange || []}
                onChange={(_, newValue: number | number[]) =>
                  onBpRangeUpdate?.(newValue as number[])
                }
                valueLabelDisplay="auto"
                valueLabelFormat={(value: number) =>
                  `bp# ${value}/${activeSequence?.sequence.length}`
                }
                getAriaValueText={(value: number) =>
                  `bp# ${value}/${activeSequence?.sequence.length}`
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box
        className="flex-1 min-h-0 overflow-x-hidden"
        sx={{ overflowY: isSequenceChart ? "hidden" : "auto" }}
      >
        {chartMethod === "bpcontent" && (
          <BasepairHistogram sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "squiggle" && (
          <SquiggleChart sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "gates" && (
          <GatesChart sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "qi" && (
          <QiChart sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "randic" && (
          <RandicChart sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "sequence" && (
          <Box className="flex min-h-full min-w-0 flex-col">
            <Box className="flex shrink-0 flex-wrap items-start">
              <Box>
                <Typography className="inline-block px-2">
                  {activeSequence?.sequence.trim().length || 0} bps
                </Typography>
                {(bpRange?.[0] || 1) !== 1 ||
                bpRange?.[1] !== activeSequence?.sequence.trim().length ? (
                  <Typography className="inline-block px-2 text-xs font-semibold">
                    {`showing only ${bpRange![1] - bpRange![0] + 1} basepairs`}
                  </Typography>
                ) : null}
              </Box>
              <Box className="grow text-right">
                <Tooltip title="display the protein chain" arrow>
                  <IconButton
                    aria-label="display the protein chain"
                    color={showProteins ? "primary" : "default"}
                    className="ml-2"
                    onClick={() => setShowProteins(!showProteins)}
                  >
                    <Share />
                  </IconButton>
                </Tooltip>
                <ButtonGroup
                  variant="outlined"
                  size="large"
                  aria-label="display options"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    top: "8px",
                    "& .MuiButtonBase-root": {
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 0,
                      ml: 0,
                    },
                  }}
                >
                  <Tooltip title="display the sequence as binary" arrow>
                    <IconButton
                      aria-label="display the sequence as binary"
                      color={displayBinary ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => setDisplayBinary(!displayBinary)}
                    >
                      <Numbers />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="display the info tooltip" arrow>
                    <IconButton
                      aria-label="display the info tooltip"
                      color={displayTooltip ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => setDisplayTooltip(!displayTooltip)}
                    >
                      <ChatBubble />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="display the sequence" arrow>
                    <IconButton
                      aria-label="display the sequence"
                      color={displaySequenceText ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => {
                        const nextDisplaySequenceText = !displaySequenceText;

                        if (!nextDisplaySequenceText && !colorizeSequence) {
                          setColorizeSequence(true);
                        }

                        setDisplaySequenceText(nextDisplaySequenceText);
                      }}
                    >
                      {displaySequenceText ? (
                        <FontDownload />
                      ) : (
                        <FontDownloadOff />
                      )}
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>
                <Tooltip title="colorize the sequence" arrow>
                  <IconButton
                    aria-label="colorize the sequence"
                    color={colorizeSequence ? "primary" : "default"}
                    className="ml-2"
                    onClick={() => setColorizeSequence(!colorizeSequence)}
                  >
                    <Brush />
                  </IconButton>
                </Tooltip>
                {navigator.clipboard && (
                  <Tooltip title="copy to clipboard" arrow>
                    <IconButton
                      aria-label="copy sequence to clipboard"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          activeSequence?.sequence.substring(
                            (bpRange?.[0] || 1) - 1,
                            (bpRange?.[1] || activeSequence?.sequence.length) +
                              1,
                          ) || "",
                        )
                      }
                      className="ml-2"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            <Box className="shrink-0">
              <Typography className="inline-block p-2 font-semibold">
                Type:
              </Typography>
              <Typography className="inline-block p-2">
                {activeSequence?.type}
              </Typography>
            </Box>
            <Box className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Divider />
              <SequenceDisplay
                sequences={activeSequences}
                showBinary={displayBinary}
                showColors={colorizeSequence}
                fillHeight={activeSequences?.length === 1}
                showProteins={showProteins}
                showText={displaySequenceText}
                showTooltip={displayTooltip}
                minBasePair={minBasePair}
                maxBasePair={maxBasePair}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
