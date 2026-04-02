import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";

import {
  Clear,
  ContentCopy,
  DeleteOutline,
  Error,
  Search,
  TableRows,
} from "@mui/icons-material";

import { Sequence } from "../_types/types";

import Title from "@/components/shared/Title";

export type SequencesTableProps = {
  activeSequences?: Sequence[] | null;
  sequences?: Record<string, Sequence>;
  onSequenceClick?: (sequence: Sequence) => void;
  onSequenceCopy?: (sequence: Sequence) => void;
  onSequenceDelete?: (sequence: Sequence) => void;
};

export default function SequencesTable({
  activeSequences = [],
  sequences = {},
  onSequenceClick,
  onSequenceCopy,
  onSequenceDelete,
}: SequencesTableProps) {
  const [sequenceFilter, setSequenceFilter] = useState<string>("");
  const [filteredSequences, setFilteredSequences] = useState<Sequence[]>(
    Object.values(sequences),
  );

  useEffect(() => {
    setFilteredSequences(Object.values(sequences));
  }, [sequences]);

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Grid container direction="row">
        <Grid item sx={{ pt: 0.5 }}>
          <TableRows height={32} width={32} sx={{ mr: 2 }} />
        </Grid>
        <Grid item>
          <Title>Sequences ({`${filteredSequences.length}`})</Title>
        </Grid>
        <Grid item sx={{ display: "flex", flexGrow: 1, justifyContent: "end" }}>
          <TextField
            label="Sequence Filter"
            sx={{ m: 1, width: "400px" }}
            onChange={(e) => {
              setSequenceFilter(e.currentTarget.value);

              const filter = (e.currentTarget.value || "").toLowerCase();

              // clear the list of filteredSequences
              filteredSequences.length = 0;

              for (const k of Object.keys(sequences)) {
                const seq = sequences[k];

                if (
                  seq.sequence.toLowerCase().includes(filter) ||
                  filter.length === 0
                ) {
                  filteredSequences.push(seq);
                }
              }

              setFilteredSequences([...filteredSequences]);
            }}
            value={sequenceFilter}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: sequenceFilter.length ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      setSequenceFilter("");
                      setFilteredSequences(Object.values(sequences));
                    }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>
      </Grid>
      <Table
        size="small"
        sx={{
          "& th, & td": {
            borderBottom: "none",
            color: "inherit",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
            height: "100%",
            verticalAlign: "top",
          },
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "table",
              tableLayout: "fixed",
              width: "-webkit-fill-available",
            }}
          >
            <TableCell sx={{ width: "12.5%" }}>Name</TableCell>
            <TableCell sx={{ width: "10%" }}>Type</TableCell>
            <TableCell sx={{ width: "10%" }}>Filename</TableCell>
            <TableCell sx={{ width: "10%" }}>Total bps</TableCell>
            <TableCell sx={{ width: "35%" }}>Sequence (first 50 bps)</TableCell>
            <TableCell sx={{ width: "7.5%" }}>In Error</TableCell>
            <TableCell sx={{ width: "7.5%" }}>Copy</TableCell>
            <TableCell sx={{ width: "7.5%" }}>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ display: "block", height: "600px", overflow: "auto" }}>
          {filteredSequences.map((seq) => (
            <TableRow
              key={seq.description}
              className={
                activeSequences
                  ?.map((seq) => seq.description)
                  .includes(seq.description)
                  ? "active"
                  : ""
              }
              onClick={() => {
                onSequenceClick?.(seq);
              }}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "table",
                tableLayout: "fixed",
                textAlign: "left",
                width: "-webkit-fill-available",
                "&.active": (theme) => ({
                  backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.28 : 0.16,
                  ),
                  color: theme.palette.text.primary,
                }),
                "&.active .MuiLink-root": {
                  color: "primary.main",
                },
                "&.active:hover": {
                  backgroundColor: "unset",
                },
                "&:hover": (theme) => ({
                  backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.18 : 0.08,
                  ),
                  color: theme.palette.text.primary,
                  cursor: "pointer",
                }),
                "&:hover .MuiLink-root": {
                  color: "primary.main",
                },
              }}
            >
              <TableCell sx={{ width: "12.5%" }}>{seq.description}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.type}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.filename}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.sequence.length}</TableCell>
              <TableCell sx={{ width: "35%" }}>
                <Link color="primary" href="#" sx={{ mt: 3 }}>
                  <Typography
                    sx={{
                      fontFamily: "Anonymous Pro",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                    }}
                  >
                    {`${seq.sequence.substring(
                      0,
                      Math.min(seq.sequence.length, 50),
                    )}${seq.sequence.length > 50 ? "..." : ""}`}
                  </Typography>
                </Link>
              </TableCell>
              <TableCell sx={{ width: "7.5%" }}>
                {seq.hasAmbiguous && <Error color="error" />}
              </TableCell>
              <TableCell sx={{ width: "7.5%" }}>
                <Tooltip title={`Copy ${seq.description}`} arrow>
                  <IconButton
                    aria-label={`Copy ${seq.description}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSequenceCopy?.(seq);
                    }}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ width: "7.5%" }}>
                <Tooltip title={`Delete ${seq.description}`} arrow>
                  <IconButton
                    aria-label={`Delete ${seq.description}`}
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSequenceDelete?.(seq);
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
