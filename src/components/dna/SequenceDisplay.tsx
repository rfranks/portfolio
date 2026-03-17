import { ReactElement, useEffect, useRef, useState } from "react";

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

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const basePairHeight = showProteins ? 56 : 35;
  const basePairHorizontalPadding = 8;
  const basePairWidth =
    (showBinary ? 19.953 : 9.977) + basePairHorizontalPadding;
  const maxHeight = 350;
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [hoveredProtein, setHoveredProtein] = useState<{
    sequenceDescription: string;
    codonEndIndex: number;
  } | null>(null);

  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(node.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const basePairsPerRow = Math.max(
    1,
    Math.floor(
      (viewportWidth || (showBinary ? 54 * basePairWidth : 111 * basePairWidth)) /
        basePairWidth
    )
  );

  const bull = (
    <Box
      component="span"
      sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}
    >
      •
    </Box>
  );

  const renderBase = (
    base: string,
    index: number,
    protein: Protein,
    sequenceDescription: string,
    sequenceValue: string
  ) => {
    const isHoveredProteinBase =
      hoveredProtein?.sequenceDescription === sequenceDescription &&
      index >= hoveredProtein.codonEndIndex - 2 &&
      index <= hoveredProtein.codonEndIndex;
    const isHoveredProteinStart =
      isHoveredProteinBase && index === hoveredProtein.codonEndIndex - 2;
    const isHoveredProteinEnd =
      isHoveredProteinBase && index === hoveredProtein.codonEndIndex;
    const currentCodon =
      showProteins && (index + 1) % 3 === 0
        ? sequenceValue.substring(index - 2, index + 1).toUpperCase()
        : "";

    return (
      <Box
        data-proteinCode={`${protein?.charCode}`}
        data-index={index}
        key={index}
        sx={{
          backgroundColor: isHoveredProteinBase
            ? "#ffb74d"
            : showColors
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
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Anonymous Pro",
          fontSize: "18px",
          fontWeight: isHoveredProteinBase ? 700 : 400,
          height: showText ? "auto" : "27px",
          mb: showText ? 1 : 0,
          px: "4px",
          width: `${basePairWidth}px`,
          boxSizing: "border-box",
          textAlign: "center",
          border: "2px solid transparent",
          borderTopColor: isHoveredProteinBase ? "#ef6c00" : "transparent",
          borderBottomColor: isHoveredProteinBase ? "#ef6c00" : "transparent",
          borderLeftColor: isHoveredProteinStart ? "#ef6c00" : "transparent",
          borderRightColor: isHoveredProteinEnd ? "#ef6c00" : "transparent",
          outline:
            !isHoveredProteinBase && !validBase(base)
              ? "1px solid red"
              : "none",
          outlineOffset: "-2px",
          overflow: "visible",
          position: "relative",
          zIndex: isHoveredProteinBase ? 2 : 1,
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
              left: `-${basePairWidth * 2}px`,
              fontSize: "12.5px",
              width: `${basePairWidth * 3}px`,
              textAlign: "center",
              mt: "28px",
              zIndex: 0,
              "&:hover": {
                fontSize: "15px",
                fontWeight: "600",
              },
            }}
            onMouseEnter={() =>
              setHoveredProtein({
                sequenceDescription,
                codonEndIndex: index,
              })
            }
            onMouseLeave={() => setHoveredProtein(null)}
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
                      {protein?.codons?.map((codon, codonIndex) => (
                        <Box
                          component="span"
                          key={`${protein?.charCode}-${codon}`}
                          sx={{
                            textDecoration:
                              protein.codons.length === 1 ||
                              codon.toUpperCase() === currentCodon
                                ? "underline"
                                : "none",
                            fontWeight:
                              protein.codons.length === 1 ||
                              codon.toUpperCase() === currentCodon
                                ? 700
                                : 400,
                          }}
                        >
                          {codon}
                          {codonIndex < protein.codons.length - 1 ? ", " : ""}
                        </Box>
                      ))}
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

  const visibleRows = maxHeight / basePairHeight;
  const pageCount = Math.max(
    1,
    Math.ceil(
      ((maxBasePair || 1) - minBasePair + 1) /
        (1.0 * basePairsPerRow * visibleRows)
    )
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

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

        return (
          <Grid item flexGrow={1} key={`${sequence?.description}-${index}`}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                width: "100%",
                overflow: "hidden",
                minHeight: `${basePairHeight}px`,
                paddingBottom: showProteins ? 1 : 0,
                alignItems: "flex-start",
              }}
            >
              {sequence?.sequence
                .substring(i, Math.min(i + basePairsPerRow, endingBP))
                .split("")
                .map((base, index) =>
                  showTooltip
                    ? wrapWithTooltip(
                        renderBase(
                          base,
                          i + index,
                          proteinChain[Math.floor((index + i) / 3)],
                          sequence.description,
                          sequence.sequence
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
                        proteinChain[Math.floor((index + i) / 3)],
                        sequence.description,
                        sequence.sequence
                      )
                )}
            </Box>
            {index === sequences.length - 1 ? <Divider sx={{ my: 1 }} /> : null}
          </Grid>
        );
      })
    );
  }

  return (
    <Box>
      <Box
        ref={viewportRef}
        sx={{
          fontFamily: "Anonymous Pro",
          fontSize: "16px",
          height: `${maxHeight}px`,
          overflow: "auto",
        }}
      >
        <Box>
          <Grid container direction="column">
            {renderedSequences?.map((renderedSequence) => renderedSequence)}
          </Grid>
        </Box>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Pagination
          size="large"
          color="primary"
          count={pageCount}
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
