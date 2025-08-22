import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { Grid, Menu, MenuItem, styled, TextareaAutosize } from "@mui/material";
import AddCircle from "@mui/icons-material/AddCircle";
import Delete from "@mui/icons-material/Delete";
import { useRef, useState } from "react";
import { Sequence } from "@/types/dna/types";
import { parseSequence } from "@/utils/dna/sequenceUtils";
import { blue, grey } from "./colors";
import Title from "../app/Title";
import { Science } from "@mui/icons-material";

const Textarea = styled(TextareaAutosize)(
  ({ theme }) => `
    resize: none;
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    border-radius: 12px 12px 0 12px;
    color: ${theme.palette.mode === "dark" ? grey[300] : grey[900]};
    background: ${theme.palette.mode === "dark" ? grey[900] : "#fff"};
    border: 1px solid ${theme.palette.mode === "dark" ? grey[700] : grey[200]};
    box-shadow: 0px 2px 2px ${
      theme.palette.mode === "dark" ? grey[900] : grey[50]
    };

    &:hover {
      border-color: ${blue[400]};
    }

    &:focus {
      outline: 0;
      border-color: ${blue[400]};
      box-shadow: 0 0 0 3px ${
        theme.palette.mode === "dark" ? blue[600] : blue[200]
      };
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `
);

export type AddSequenceCardProps = {
  onAddSequence?: (sequence: Sequence) => void;
};

export default function AddSequenceCard({
  onAddSequence,
}: AddSequenceCardProps) {
  const [rawSequenceContent, setRawSequenceContent] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loadSampleMenuEl, setLoadSampleMenuEl] = useState<null | HTMLElement>(
    null
  );
  const loadSampleMenuOpen = Boolean(loadSampleMenuEl);

  const loadSample = async (sample: string) => {
    let rawSequenceContent = await (
      await fetch(`${window.location.pathname}/assets/dna/examples/${sample}`)
    ).text();

    const isError = rawSequenceContent.startsWith("<!DOCTYPE html>");
    isError &&
      (rawSequenceContent = await (
        await fetch(
          `${window.location.pathname}/public/assets/dna/examples/${sample}`
        )
      ).text());

    parseSequence(rawSequenceContent, sample, (parsedSequence) => {
      parsedSequence.sequence = parsedSequence.sequence.trim();

      onAddSequence?.(parsedSequence);
    });
  };

  return (
    <Card>
      <CardContent>
        <Grid container direction="row">
          <Grid item sx={{ p: 0.5 }}>
            <Science />
          </Grid>
          <Grid item>
            <Title>Add sequences</Title>
          </Grid>
        </Grid>

        {/* <Typography
          variant="body2"
          color="text.secondary"
          maxWidth={"100%"}
          sx={{ textWrap: "wrap" }}
        >
          Add a sequence to analyze by pasting the sequence, or dragging and
          dropping a file onto the textarea input.
        </Typography> */}
        <Textarea
          ref={textareaRef}
          minRows={10}
          maxRows={10}
          aria-label="FASTA sequence or other supported format"
          placeholder="Paste your sequence here, or drag and drop a file here..."
          value={rawSequenceContent}
          onChange={(e) => setRawSequenceContent(e?.target?.value || "")}
        />
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Button
          id="load-sample-button"
          aria-controls={loadSampleMenuOpen ? "load-sample-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={loadSampleMenuOpen ? "true" : undefined}
          onClick={(e) => setLoadSampleMenuEl(e?.currentTarget)}
          sx={{ justifySelf: "flex-start" }}
        >
          Load Sample
        </Button>
        <Menu
          id="load-sample-menu"
          anchorEl={loadSampleMenuEl}
          open={loadSampleMenuOpen}
          onClose={() => setLoadSampleMenuEl(null)}
          MenuListProps={{
            "aria-labelledby": "load-sample-button",
          }}
        >
          {[
            "fasta/1_4500010bp_random_seq.fasta",
            "fasta/10_4500000_random_seqs.fasta",
            "fasta/100_12000bp_random_seqs.fasta",
            "fasta/banth1.heg.fasta",
            "fasta/BoNT.fasta",
            "fasta/bsub.fasta",
            "fasta/ecol.heg.fasta",
            "fasta/GCA_000293765.1_ASM29376v1_genomic.fna",
            "fasta/gfp.fasta",
            "fasta/hbb.fasta",
            "fasta/human_HBB.fasta",
            "fasta/insulin.fasta",
            "fasta/luciferase.fasta",
            "fasta/multiple_bad_seqs.fasta",
            "fasta/mysteryGenome_1.fasta",
            "fasta/mysteryGenome_2.fasta",
            "fasta/ngon.heg.fasta",
            "fasta/norway_rat_HBB.fasta",
            "fasta/oxytocin.fasta",
            "fasta/paer.heg.fasta",
            "fasta/rhesus_HBB.fasta",
            "fasta/sars-cov-2.fasta",
            "fasta/test.fasta",
            "fasta/titin.fasta",
          ]
            .sort()
            .map((sample) => (
              <MenuItem
                onClick={() => {
                  loadSample(sample);
                  setLoadSampleMenuEl(null);
                }}
              >
                {sample}
              </MenuItem>
            ))}
        </Menu>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Delete />}
          onClick={() => {
            setRawSequenceContent("");
            textareaRef?.current?.focus();
          }}
        >
          Clear
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() =>
            parseSequence(
              rawSequenceContent,
              "todo-filename",
              (parsedSequence) => {
                parsedSequence.sequence = parsedSequence.sequence.trim();

                onAddSequence?.(parsedSequence);
                setRawSequenceContent("");
                textareaRef.current?.focus();
              }
            )
          }
          disabled={rawSequenceContent?.length === 0}
        >
          Add
        </Button>
      </CardActions>
    </Card>
  );
}
