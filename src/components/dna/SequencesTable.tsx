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

import { Clear, Error, Search, TableRows } from "@mui/icons-material";

import { blue } from "./colors";
import { Sequence } from "@/types/dna/types";

import Title from "../app/Title";

export type SequencesTableProps = {
  activeSequences?: Sequence[] | null;
  sequences?: Record<string, Sequence>;
  onSequenceClick?: (sequence: Sequence) => void;
};

export default function SequencesTable({
  activeSequences = [],
  sequences = {},
  onSequenceClick,
}: SequencesTableProps) {
  const [sequenceFilter, setSequenceFilter] = useState<string>("");
  const [filteredSequences, setFilteredSequences] = useState<Sequence[]>(
    Object.values(sequences)
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
              borderBottom: "1px solid rgba(224, 224, 224, 1)",
              display: "table",
              tableLayout: "fixed",
              width: "-webkit-fill-available",
            }}
          >
            <TableCell sx={{ width: "12.5%" }}>Name</TableCell>
            <TableCell sx={{ width: "10%" }}>Type</TableCell>
            <TableCell sx={{ width: "10%" }}>Filename</TableCell>
            <TableCell sx={{ width: "10%" }}>Total bps</TableCell>
            <TableCell sx={{ width: "50%" }}>Sequence (first 50 bps)</TableCell>
            <TableCell sx={{ width: "7.5%" }}>In Error</TableCell>
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
                borderBottom: "1px solid rgba(224, 224, 224, 1)",
                display: "table",
                tableLayout: "fixed",
                textAlign: "left",
                width: "-webkit-fill-available",
                "&.active": {
                  backgroundColor: blue[200],
                  color: "grey.900",
                },
                "&.active:hover": {
                  backgroundColor: blue[200],
                },
                "&.active .MuiLink-root": {
                  color: "blue",
                },
                "&:hover": {
                  backgroundColor: blue[100],
                  color: "grey.900",
                  cursor: "pointer",
                },
                "&:hover .MuiLink-root": {
                  color: "blue",
                },
              }}
            >
              <TableCell sx={{ width: "12.5%" }}>{seq.description}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.type}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.filename}</TableCell>
              <TableCell sx={{ width: "10%" }}>{seq.sequence.length}</TableCell>
              <TableCell sx={{ width: "50%" }}>
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
                      Math.min(seq.sequence.length, 50)
                    )}${seq.sequence.length > 50 ? "..." : ""}`}
                  </Typography>
                </Link>
              </TableCell>
              <TableCell sx={{ width: "7.5%" }}>
                {seq.hasAmbiguous && <Error color="error" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
