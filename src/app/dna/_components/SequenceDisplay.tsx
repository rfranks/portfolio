import { ReactElement, useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { TooltipProps } from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";
import { useTheme } from "@mui/material/styles";

import { Base, Protein, ProteinCode, Sequence } from "../_types/types";
import {
  baseTo2bit,
  baseToColor,
  isMaxBase,
  translateSequenceToAminoAcids,
  validBase,
} from "../_utils/sequenceUtils";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { PROTEINS } from "../_consts/consts";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export type SequenceDisplayProps = {
  sequences?: Sequence[] | null;
  showBinary?: boolean;
  showColors?: boolean;
  showColorsMaxBasePairs?: boolean;
  fillHeight?: boolean;
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
  fillHeight = false,
  minBasePair = 1,
  maxBasePair,
}: SequenceDisplayProps) {
  const theme = useTheme();
  // this may need to evolve to be the shortest maximum?
  maxBasePair = maxBasePair || sequences?.[0]?.sequence.length;

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const basePairHeight = showProteins ? 48 : 30;
  const basePairHorizontalPadding = 8;
  const basePairWidth = (showBinary ? 19.953 : 9.977) + basePairHorizontalPadding;
  const defaultViewportHeight = 280;
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [hoveredProtein, setHoveredProtein] = useState<{
    sequenceDescription: string;
    codonEndIndex: number;
  } | null>(null);
  const [hoveredBase, setHoveredBase] = useState<{
    sequenceDescription: string;
    baseIndex: number;
  } | null>(null);

  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(node.clientWidth);
      setViewportHeight(node.clientHeight);
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
      (viewportWidth || (showBinary ? 54 * basePairWidth : 111 * basePairWidth)) / basePairWidth,
    ),
  );

  const bull = (
    <Box component="span" sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}>
      •
    </Box>
  );

  const renderBase = (
    base: string,
    index: number,
    protein: Protein,
    sequenceDescription: string,
    sequenceValue: string,
  ) => {
    const isHoveredProteinBase =
      hoveredProtein?.sequenceDescription === sequenceDescription &&
      index >= hoveredProtein.codonEndIndex - 2 &&
      index <= hoveredProtein.codonEndIndex;
    const isHoveredBase =
      !hoveredProtein &&
      hoveredBase?.sequenceDescription === sequenceDescription &&
      hoveredBase.baseIndex === index;
    const isHoveredProteinStart =
      isHoveredProteinBase && index === hoveredProtein.codonEndIndex - 2;
    const isHoveredProteinEnd = isHoveredProteinBase && index === hoveredProtein.codonEndIndex;
    const currentCodon =
      showProteins && (index + 1) % 3 === 0
        ? sequenceValue.substring(index - 2, index + 1).toUpperCase()
        : "";

    return (
      <Box
        data-protein-code={`${protein?.charCode}`}
        data-index={index}
        key={index}
        sx={{
          backgroundColor:
            isHoveredProteinBase || isHoveredBase
              ? "#ffffff"
              : showColors
                ? !showColorsMaxBasePairs &&
                  isMaxBase(
                    sequences!.map((sequence) => sequence.sequence[index]).join(""),
                    base as Base,
                  ) &&
                  (sequences?.length || 0) > 1
                  ? "transparent"
                  : baseToColor(base)
                : "transparent",
          color: "#000000",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Anonymous Pro",
          fontSize: "16px",
          fontWeight: isHoveredProteinBase || isHoveredBase ? 700 : 400,
          height: showText ? "auto" : "27px",
          mb: showText ? 1 : 0,
          px: "4px",
          width: `${basePairWidth}px`,
          boxSizing: "border-box",
          textAlign: "center",
          border: "2px solid transparent",
          borderTopColor: isHoveredProteinBase ? theme.palette.warning.dark : "transparent",
          borderBottomColor: isHoveredProteinBase ? theme.palette.warning.dark : "transparent",
          borderLeftColor: isHoveredProteinStart ? theme.palette.warning.dark : "transparent",
          borderRightColor: isHoveredProteinEnd ? theme.palette.warning.dark : "transparent",
          boxShadow: isHoveredBase ? `inset 0 0 0 2px ${theme.palette.warning.dark}` : "none",
          borderRadius: isHoveredBase ? "4px" : 0,
          outline:
            !isHoveredProteinBase && !validBase(base)
              ? `1px solid ${theme.palette.error.main}`
              : "none",
          outlineOffset: "-2px",
          overflow: "visible",
          position: "relative",
          zIndex: isHoveredProteinBase || isHoveredBase ? 2 : 1,
        }}
        onMouseEnter={() =>
          setHoveredBase({
            sequenceDescription,
            baseIndex: index,
          })
        }
        onMouseLeave={() => setHoveredBase(null)}
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
              color: theme.palette.text.primary,
              position: "absolute",
              top: 0,
              left: `-${basePairWidth * 2}px`,
              fontSize: "11px",
              width: `${basePairWidth * 3}px`,
              textAlign: "center",
              mt: "24px",
              zIndex: 0,
              "&:hover": {
                fontSize: "13px",
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
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                      Protein
                    </Typography>
                    <Typography variant="h5" component="div">
                      {protein?.fullName}
                      {bull}
                      {protein?.charCode}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      {protein?.codons?.map((codon, codonIndex) => (
                        <Box component="span" key={`${protein?.charCode}-${codon}`}>
                          <Box
                            component="span"
                            sx={{
                              display: "inline-block",
                              fontWeight:
                                protein.codons.length === 1 || codon.toUpperCase() === currentCodon
                                  ? 700
                                  : 400,
                              border:
                                protein.codons.length === 1 || codon.toUpperCase() === currentCodon
                                  ? `1px solid ${theme.palette.warning.dark}`
                                  : "1px solid transparent",
                              borderRadius:
                                protein.codons.length === 1 || codon.toUpperCase() === currentCodon
                                  ? "999px"
                                  : 0,
                              px:
                                protein.codons.length === 1 || codon.toUpperCase() === currentCodon
                                  ? 0.75
                                  : 0,
                              py:
                                protein.codons.length === 1 || codon.toUpperCase() === currentCodon
                                  ? 0.125
                                  : 0,
                            }}
                          >
                            {codon}
                          </Box>
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
                index,
                "bottom",
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
    index: number,
    placement: TooltipProps["placement"] = "top",
  ) => (
    <Tooltip
      key={index}
      title={title}
      placement={placement}
      arrow
      followCursor={placement === "top"}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: placement === "bottom" ? [0, 2] : [0, 12],
              },
            },
          ],
        },
      }}
      sx={{
        '& [data-popper-placement="bottom"]': {
          mt: "4px !important",
        },
        '& [data-popper-placement="top"]': {
          mb: "24px !important",
        },
      }}
    >
      {content}
    </Tooltip>
  );

  const availableViewportHeight =
    fillHeight && viewportHeight > 0 ? viewportHeight : defaultViewportHeight;
  const sequenceCount = Math.max(1, sequences?.length || 1);
  const visibleSequenceSets = Math.max(
    1,
    Math.floor(availableViewportHeight / (basePairHeight * sequenceCount)),
  );
  const pageCount = Math.max(
    1,
    Math.ceil(
      ((maxBasePair || 1) - minBasePair + 1) / (1.0 * basePairsPerRow * visibleSequenceSets),
    ),
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  const startingBP = Math.max((page - 1) * visibleSequenceSets * basePairsPerRow, minBasePair - 1);
  const endingBP = Math.min(startingBP + visibleSequenceSets * basePairsPerRow, maxBasePair || 1);

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
                  showTooltip && !hoveredProtein
                    ? wrapWithTooltip(
                        renderBase(
                          base,
                          i + index,
                          proteinChain[Math.floor((index + i) / 3)],
                          sequence.description,
                          sequence.sequence,
                        ),
                        <>
                          <Typography>
                            {`bp # ${startingBP + i + index + 1} / ${
                              sequence?.sequence.length
                            } => ${base} ${showBinary ? "(" + baseTo2bit(base) + ")" : ""}`}
                          </Typography>
                          <Typography sx={{ fontWeight: 600 }}>{sequence.description}</Typography>
                        </>,
                        index,
                      )
                    : renderBase(
                        base,
                        index + i,
                        proteinChain[Math.floor((index + i) / 3)],
                        sequence.description,
                        sequence.sequence,
                      ),
                )}
            </Box>
            {index === sequences.length - 1 ? <Divider sx={{ my: 1 }} /> : null}
          </Grid>
        );
      }),
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : "0 0 auto",
        minHeight: 0,
        minWidth: 0,
        width: "100%",
      }}
    >
      <Box
        ref={viewportRef}
        sx={{
          fontFamily: "Anonymous Pro",
          fontSize: "16px",
          backgroundColor: showText ? "#ffffff" : "transparent",
          height: fillHeight ? "100%" : `${defaultViewportHeight}px`,
          overflow: "auto",
          paddingBottom: showProteins ? 3 : 0,
          flex: 1,
          minHeight: fillHeight ? 0 : `${defaultViewportHeight}px`,
          minWidth: 0,
          width: "100%",
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
