import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { Alert, Grid, Menu, MenuItem, styled, TextareaAutosize } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddCircle from "@mui/icons-material/AddCircle";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import { useRef, useState } from "react";
import { Sequence } from "../_types/types";
import { parseSequence } from "../_utils/sequenceUtils";
import { Title } from "@/components/shared";
import { Science } from "@mui/icons-material";
import { withBasePath } from "@/utils/basePath";

const Textarea = styled(TextareaAutosize)(
  ({ theme }) => `
    resize: none;
    width: 100%;
    max-height: min(45dvh, 420px);
    overflow: auto;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    border-radius: 12px 12px 0 12px;
    color: ${theme.palette.text.primary};
    background: var(--dna-surface-2);
    border: 1px solid var(--dna-surface-border);
    box-shadow: inset 0 1px 0 var(--dna-inner-glow);

    &:hover {
      border-color: var(--dna-surface-border-strong);
    }

    &:focus {
      outline: 0;
      border-color: ${alpha(theme.palette.primary.main, 0.7)};
      box-shadow: 0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)};
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `,
);

export type AddSequenceCardProps = {
  onAddSequence?: (sequence: Sequence) => void;
  onClose?: () => void;
};

export default function AddSequenceCard({ onAddSequence, onClose }: AddSequenceCardProps) {
  const [rawSequenceContent, setRawSequenceContent] = useState<string>("");
  const [confirmClear, setConfirmClear] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loadSampleMenuEl, setLoadSampleMenuEl] = useState<null | HTMLElement>(null);
  const loadSampleMenuOpen = Boolean(loadSampleMenuEl);

  const loadSample = async (sample: string) => {
    const sampleContent = await (await fetch(withBasePath(`/apps/dna/examples/${sample}`))).text();

    setRawSequenceContent(sampleContent);
    setConfirmClear(false);

    parseSequence(sampleContent, sample, (parsedSequence) => {
      parsedSequence.sequence = parsedSequence.sequence.trim();

      onAddSequence?.(parsedSequence);
    });
  };

  return (
    <Card
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100dvh - 32px)",
      }}
    >
      {onClose && (
        <IconButton
          aria-label="close add sequence dialog"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>
      )}
      <CardContent sx={{ overflowY: "auto" }}>
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
          minRows={6}
          maxRows={18}
          aria-label="FASTA sequence or other supported format"
          placeholder="Paste your sequence here, or drag and drop a file here..."
          value={rawSequenceContent}
          onChange={(e) => {
            setRawSequenceContent(e?.target?.value || "");
            setConfirmClear(false);
          }}
        />
      </CardContent>
      {confirmClear && (
        <CardContent sx={{ pt: 0 }}>
          <Alert
            severity="warning"
            action={
              <Grid container spacing={1} wrap="nowrap">
                <Grid item>
                  <Button size="small" color="inherit" onClick={() => setConfirmClear(false)}>
                    No
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => {
                      setRawSequenceContent("");
                      setConfirmClear(false);
                      textareaRef.current?.focus();
                    }}
                  >
                    Yes, clear
                  </Button>
                </Grid>
              </Grid>
            }
          >
            Clear the current sequence input?
          </Alert>
        </CardContent>
      )}
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Button
          id="load-sample-button"
          aria-controls={loadSampleMenuOpen ? "load-sample-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={loadSampleMenuOpen ? "true" : undefined}
          onClick={(e) => setLoadSampleMenuEl(e?.currentTarget)}
          sx={{ mr: "auto" }}
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
                key={sample}
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
          color="error"
          startIcon={<Delete />}
          onClick={() => {
            if (!rawSequenceContent.length) {
              return;
            }

            setConfirmClear(true);
          }}
          disabled={confirmClear}
        >
          Clear
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() =>
            parseSequence(rawSequenceContent, "todo-filename", (parsedSequence) => {
              parsedSequence.sequence = parsedSequence.sequence.trim();

              onAddSequence?.(parsedSequence);
              setRawSequenceContent("");
              setConfirmClear(false);
              textareaRef.current?.focus();
            })
          }
          disabled={rawSequenceContent?.length === 0}
        >
          Add
        </Button>
      </CardActions>
    </Card>
  );
}
