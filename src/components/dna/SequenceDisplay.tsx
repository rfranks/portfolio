import { ReactElement, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";

import { Base, Protein, ProteinCode, Sequence } from "@/types/dna/types";
import {
  baseTo2bit,
  baseToColor,
  isMaxBase,
  translateSequenceToAminoAcids,
  validBase,
} from "@/utils/dna/sequenceUtils";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { PROTEINS } from "@/consts/dna/consts";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export type SequenceDisplayProps = {
  sequences?: Sequence[] | null;
  showBinary?: boolean;
  showColors?: boolean;
  showColorsMaxBasePairs?: boolean;
  showProteins?: boolean;
  showText?: boolean;
  showTooltip?: boolean;
  maxBasePair?: number;
  minBasePair?: number;
};

export default function SequenceDisplay({
  sequences = [],
  showBinary,
  showColors = true,
  showProteins = false,
  showText = true,
  showTooltip = true,
  showColorsMaxBasePairs = false,
  minBasePair = 1,
  maxBasePair,
}: SequenceDisplayProps) {
  // this may need to evolve to be the shortest maximum?
  maxBasePair = maxBasePair || sequences?.[0]?.sequence.length;

  const ref = useRef<HTMLDivElement | null>(null);

  const basePairHeight = 35;
  const basePairWidth = showBinary ? 19.953 : 9.977;
  const basePairsPerRow = ref?.current?.offsetWidth
    ? Math.floor(ref?.current?.offsetWidth / basePairWidth)
    : showBinary
    ? 54
    : 111;
  // const totalBPs = (maxBasePair || 1) - minBasePair + 1;
  // const totalRows = Math.floor(totalBPs / (1.0 * basePairsPerRow)) + 1;
  // const totalRowHeight = totalRows * basePairHeight;
  const maxHeight = 350;

  // const [scrollTop, setScrollTop] = useState<number>(0);
  const [page, setPage] = useState<number>(1);

  // const handleScroll = (e: any) => setScrollTop(e?.target?.scrollTop || 0);

  const bull = (
    <Box
      component="span"
      sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}
    >
      •
    </Box>
  );

  const renderBase = (base: string, index: number, protein: Protein) => {
    return (
      <Box
        data-proteinCode={`${protein?.charCode}`}
        data-index={index}
        key={index}
        sx={{
          backgroundColor: showColors
            ? !showColorsMaxBasePairs &&
              isMaxBase(
                sequences!.map((sequence) => sequence.sequence[index]).join(""),
                base as Base
              ) &&
              (sequences?.length || 0) > 1
              ? "transparent"
              : baseToColor(base)
            : "transparent",
          color:
            !showColorsMaxBasePairs &&
            isMaxBase(
              sequences!.map((sequence) => sequence.sequence[index]).join(""),
              base as Base
            ) &&
            (sequences?.length || 0) > 1
              ? "#151515"
              : showColors
              ? "#151515"
              : "#fff",
          display: "inline-block",
          fontFamily: "Anonymous Pro",
          fontSize: "18px",
          height: showText ? "auto" : "27px",
          mb: showText ? 1 : 0,
          width: `${basePairWidth}px`,
          border: validBase(base) ? "none" : "1px solid red",
          overflow: "visible",
          position: "relative",
          zIndex: 1,
        }}
      >
        {showText
          ? showBinary
            ? baseTo2bit(base.toUpperCase())
            : base.toUpperCase()
          : showBinary
          ? "  "
          : " "}
        {showProteins && (index + 1) % 3 === 0 && (
          <Box
            sx={{
              color: "#151515",
              position: "absolute",
              top: 0,
              left: "-20px",
              fontSize: "10px",
              width: "301%", //wtf?
              textAlign: "right",
              mt: "24px",
              zIndex: 0,
              "&:hover": {
                fontSize: "12px",
                fontWeight: "600",
              },
            }}
          >
            {showTooltip ? (
              wrapWithTooltip(
                <Box>{protein?.abbrevName}</Box>,
                <Card variant="outlined" sx={{ minWidth: 275, zIndex: 9999 }}>
                  <CardContent>
                    <Typography
                      sx={{ fontSize: 14 }}
                      color="text.secondary"
                      gutterBottom
                    >
                      Protein
                    </Typography>
                    <Typography variant="h5" component="div">
                      {protein?.fullName}
                      {bull}
                      {protein?.charCode}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      {protein?.codons?.join(",")}
                    </Typography>
                    <Typography variant="body2">
                      {protein?.description}
                      <br />
                      <br />
                      <br />
                    </Typography>
                  </CardContent>
                  {/* <CardActions>
                      <Button size="small">Learn More</Button>
                    </CardActions> */}
                </Card>,
                index
              )
            ) : (
              <Box>{protein?.abbrevName || "Oops"}</Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const wrapWithTooltip = (
    content: ReactElement,
    title: ReactElement,
    index: number
  ) => (
    <Tooltip key={index} title={title} placement="top" arrow followCursor>
      {content}
    </Tooltip>
  );

  // const pagesBeforeAndAfter = 3;
  const visibleRows = maxHeight / basePairHeight;
  // const totalRowsBefore = Math.ceil(scrollTop / basePairHeight);
  // const visibleRowsBefore = Math.min(totalRowsBefore, visibleRows);
  // const invisibleRowsBefore = totalRowsBefore - visibleRowsBefore;

  // const startingBP = Math.min(
  //   maxBasePair || 1,
  //   minBasePair + invisibleRowsBefore * basePairsPerRow
  // );

  // const endingBP = Math.min(
  //   startingBP + 3 * visibleRows * basePairsPerRow,
  //   (maxBasePair || 1) - startingBP
  // );

  // const visibleBPs = endingBP - startingBP + 1;

  // const paddingTop = invisibleRowsBefore * basePairHeight;

  const startingBP = Math.max(
    (page - 1) * visibleRows * basePairsPerRow,
    minBasePair - 1
  );
  const endingBP = Math.min(
    startingBP + visibleRows * basePairsPerRow,
    maxBasePair || 1
  );

  const renderedSequences = [];

  for (let i = startingBP; i < endingBP; i += basePairsPerRow) {
    renderedSequences.push(
      sequences?.map((sequence, index) => {
        // this is performance issue may need fixing
        const proteinChain = showProteins
          ? translateSequenceToAminoAcids(sequence.sequence)
              .split("")
              .map((proteinCode) => PROTEINS[proteinCode as ProteinCode])
          : [];

        debugger;

        return (
          <Grid item flexGrow={1} key={`${sequence?.description}-${index}`}>
            {sequence?.sequence
              .substring(i, Math.min(i + basePairsPerRow, endingBP))
              .split("")
              .map((base, index) =>
                showTooltip
                  ? wrapWithTooltip(
                      renderBase(
                        base,
                        i + index,
                        proteinChain[Math.floor((index + i) / 3)]
                      ),
                      <>
                        <Typography>
                          {`bp # ${startingBP + i + index + 1} / ${
                            sequence?.sequence.length
                          } => ${base} ${
                            showBinary ? "(" + baseTo2bit(base) + ")" : ""
                          }`}
                        </Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          {sequence.description}
                        </Typography>
                      </>,
                      index
                    )
                  : renderBase(
                      base,
                      index + i,
                      proteinChain[Math.floor((index + i) / 3)]
                    )
              )}
            {index === sequences.length - 1 ? <Divider sx={{ my: 1 }} /> : null}
          </Grid>
        );
      })
    );
  }

  return (
    <Box>
      <Box
        sx={{
          textWrap: "wrap",
          wordBreak: "break-word",
          fontFamily: "Anonymous Pro",
          fontSize: "16px",
          height: `${maxHeight}px`,
          overflow: "auto",
        }}
        // onScroll={handleScroll}
      >
        <Box
          ref={ref}
          sx={
            {
              // pt: `${paddingTop}px`,
              // height: `${totalRowHeight}px`,
            }
          }
        >
          <Grid container direction="column">
            {renderedSequences?.map((renderedSequence) => renderedSequence)}
          </Grid>
        </Box>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Pagination
          size="large"
          color="primary"
          count={Math.ceil(
            ((maxBasePair || 1) - minBasePair + 1) /
              (1.0 * basePairsPerRow * visibleRows)
          )}
          page={page}
          showFirstButton
          showLastButton
          variant="outlined"
          onChange={(_, page) => setPage(page)}
          sx={{
            "& .MuiPagination-ul": {
              justifyContent: "center",
            },
          }}
        />
      </Box>
    </Box>
  );
}
