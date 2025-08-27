import React from "react";

// MUI components
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

// MUI icons
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
// utils
import { formatToMilitaryTime } from "@utils";

// components
import { CellWithPopper } from "@components/CellWithPopper";
import SemanticBadge from "@components/SemanticBadge";

// utils
import capitalize from "lodash/capitalize";

function isRenderAsChem7(name: string) {
  const upperName = name.toUpperCase();
  return [
    "BMP",
    "9Z BASIC METABOLIC PANEL",
    "9Z COMPREHENSIVE METABOLIC",
    "9Z COMPREHENSIVE METABOLIC PNL",
    "BASIC METABOLIC PANEL",
    "BLOOD GAS CHEMISTRY",
    "CAPILLARY BLD GAS W/CHEMISTRY",
    "COMPREHENSIVE METABOLIC PANEL",
    "Chem 7",
    "CHEM 7",
    "ELECTROLYTES PROFILE",
    "ER CHEMISTRY PROFILE",
    "I-STAT CHEM 8",
    "PEDIATRIC CHEM 7",
    "RENAL PROFILE",
  ].includes(upperName);
}

function isRenderAsCBC(name: string) {
  const upperName = name.toUpperCase();
  return [
    "CBC",
    "CBC CORD BLOOD W/DIFF",
    "CBC W/AUTO DIFFERENTIAL",
    "CBC W/MANUAL DIFFERENTIAL",
    "CBC W/O DIFF",
    "HGB & HCT",
  ].includes(upperName);
}

/** Renders one cell with background color for severity and black text. */
function renderLabCell(
  lab?: LabComponent,
  panel?: string,
  sx?: SxProps<Theme>,
  rowSpan?: number,
) {
  if (!lab) {
    return <TableCell align="center" rowSpan={rowSpan} sx={sx}></TableCell>;
  }

  const trendStatus =
    lab.trendStatus === "INCREASING"
      ? " ↑ "
      : lab.trendStatus === "DECREASING"
        ? " ↓ "
        : "";
  const display = `${lab.value}${lab.normalStatus}${trendStatus}`.trim();

  return (
    <TableCell
      align="center"
      rowSpan={rowSpan}
      sx={{
        border: "none",
        ...sx,
        fontWeight: lab.severity !== "N" ? 700 : 400,
        color: "unset",
        p: 0.5,
        whiteSpace: "nowrap",
      }}
    >
      <CellWithPopper
        value={
          <Tooltip title={lab.name} arrow>
            <>
              <SemanticBadge
                label={display}
                severity={
                  lab.severity === "C"
                    ? "error"
                    : lab.severity === "A"
                      ? "warning"
                      : "success"
                }
                variant={"filled"}
                icon={false}
                sx={
                  lab.severity === "N"
                    ? {
                        backgroundColor: "transparent",
                        border: "none",
                        color: "black",
                        fontWeight: 400,
                        px: 0.25,
                      }
                    : {
                        border: "1px solid",
                        fontWeight: lab.severity !== "N" ? 700 : 400,
                        px: 0.25,
                      }
                }
              />
              {lab.comment ? (
                <Typography component="span" variant="body1" color="blue">
                  *
                </Typography>
              ) : null}
            </>
          </Tooltip>
        }
        popperTitle={renderPopperTitle(lab)}
        popperContent={renderPopperContent(lab)}
        drawer
      />
    </TableCell>
  );
}

function renderPopperTitle(lab: LabComponent) {
  return (
    <Typography
      variant="h5"
      sx={{
        fontStyle: "normal",
        fontWeight: 500,
        fontSize: "16px",
        lineHeight: "24px",
        color: "#010F0C",
      }}
    >
      {lab?.name}
    </Typography>
  );
}

function renderPopperContent(lab: LabComponent) {
  const trendStatus =
    lab.trendStatus === "INCREASING"
      ? " ↑ "
      : lab.trendStatus === "DECREASING"
        ? " ↓ "
        : " - ";
  return (
    <Box>
      {renderLabelValue(
        "Date/Time",
        formatToMilitaryTime(lab.clinicalSignificantTime || ""),
      )}
      {renderLabelValue(
        "Value",

        <SemanticBadge
          label={`${lab.value}${lab.units !== "%" ? " " : ""}${lab.units ? lab.units : ""} (${lab.normalStatus}) ${trendStatus === " - " ? "" : trendStatus}`}
          severity={
            lab.severity === "C"
              ? "error"
              : lab.severity === "A"
                ? "warning"
                : "success"
          }
          variant={"filled"}
          icon={false}
          sx={
            lab.severity === "N"
              ? {
                  backgroundColor: "transparent",
                  color: "black",
                  border: "none",
                  fontWeight: 400,
                  mr: 1,
                  mb: 1,
                  px: 0.25,
                }
              : {
                  border: "1px solid",
                  fontWeight: lab.severity !== "N" ? 700 : 400,
                  mr: 1,
                  px: 0.25,
                }
          }
        />,
      )}
      {renderLabelValue(
        "Normal Range",
        `${lab.normalLow} - ${lab.normalHigh}${lab.units === "%" ? "" : " "}${lab.units ? lab.units : ""}`,
      )}
      {renderLabelValue("Severity", lab.severity!)}
      {renderLabelValue("Status", lab.completedStatus!)}
      {renderLabelValue(
        "Trend",
        ["INCREASING", "DECREASING"].includes(lab.trendStatus!)
          ? `${trendStatus}, was ${lab.previousValue!.value}`
          : "-",
      )}
      {renderLabelValue("Comment", lab.comment || "-")}
    </Box>
  );
}

/** Table-based Chem7 layout:
 *
 * Row1: Na, Cl, BUN
 * Row2: K, HCO3/CO2, Cr, optional Glu
 */
function renderChem7(
  na?: LabComponent,
  cl?: LabComponent,
  bun?: LabComponent,
  k?: LabComponent,
  co2?: LabComponent,
  cr?: LabComponent,
  glu?: LabComponent,
) {
  return (
    <Table
      size="small"
      sx={{
        width: "auto",
        border: "none",
        "& td": { p: 0 },
      }}
    >
      <TableBody>
        {/* top row */}
        <TableRow>
          {renderLabCell(na, "BMP", {
            borderBottom: "4px solid black",
            borderRight: "4px solid black",
          })}
          {renderLabCell(cl, "BMP", {
            borderBottom: "4px solid black",
            borderRight: "4px solid black",
          })}
          {renderLabCell(bun, "BMP", {
            borderBottom: "4px solid black",
          })}
          {glu ? (
            <TableCell
              rowSpan={2}
              align="center"
              sx={{
                border: "none",
                p: 0,
                verticalAlign: "middle",
                maxWidth: "20px",
              }}
            >
              <Box position={"relative"} top={2} left={-18}>
                <KeyboardArrowLeft sx={{ fontSize: "52px" }} />
              </Box>
            </TableCell>
          ) : null}
          {glu ? renderLabCell(glu, "", {}, 2) : null}
        </TableRow>
        {/* second row */}
        <TableRow>
          {renderLabCell(k, "BMP", { borderRight: "4px solid black" })}
          {renderLabCell(co2, "BMP", { borderRight: "4px solid black" })}
          {renderLabCell(cr, "BMP")}
        </TableRow>
      </TableBody>
    </Table>
  );
}

/** Table-based CBC layout:
 *
 * Row1: WBC
 * Row2: RBC, Hgb
 * Row3: Hct
 * Row4: Plt
 */
function renderCBC(
  wbc?: LabComponent,
  hb?: LabComponent,
  hct?: LabComponent,
  plt?: LabComponent,
) {
  return (
    <Table
      size="small"
      sx={{ width: "auto", border: "none", "& td": { p: 0 } }}
    >
      <TableBody>
        {/* top row */}
        <TableRow>
          {renderLabCell(wbc, "CBC", {}, 2)}
          <TableCell
            rowSpan={2}
            align="center"
            sx={{
              border: "none",
              p: 0,
              verticalAlign: "middle",
              maxWidth: "20px",
            }}
          >
            <Box position={"relative"} left={-10} top={1}>
              <KeyboardArrowRight sx={{ fontSize: "52px" }} />
            </Box>
          </TableCell>
          {renderLabCell(hb, "CBC", { borderBottom: "4px solid black" })}
          <TableCell
            rowSpan={2}
            align="center"
            sx={{
              border: "none",
              p: 0,
              verticalAlign: "middle",
              maxWidth: "20px",
            }}
          >
            <Box position={"relative"} left={-18} top={2}>
              <KeyboardArrowLeft sx={{ fontSize: "52px" }} />
            </Box>
          </TableCell>
          {renderLabCell(plt, "CBC", {}, 2)}
        </TableRow>
        {/* second row */}
        <TableRow>{renderLabCell(hct, "CBC")}</TableRow>
      </TableBody>
    </Table>
  );
}

function renderLabelValue(
  label: string,
  value: React.ReactElement | string | number | null,
) {
  return (
    <Grid container spacing={1} sx={{ width: "100%" }}>
      <Grid size={{ xs: 4, sm: 4, md: 4 }}>
        <Typography
          variant="body1"
          sx={{
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "24px",
            color: "#666666",
            py: "5px !important",
            px: "24px !important",
          }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 8, sm: 8, md: 8 }} flexGrow={1}>
        <Typography
          variant="body1"
          sx={{
            /* Body S Bold */
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "24px",
            color: "#000000",
            py: "5px !important",
            px: "24px !important",
          }}
        >
          {typeof value === "object"
            ? value
            : `${value != undefined ? value : ""}` || "-"}
        </Typography>
      </Grid>
    </Grid>
  );
}

/**
 * If leftover labs exist, we can show them in a separate table or
 * just as text, as in the previous approach.
 */
function renderLeftover(labs: LabComponent[]) {
  if (!labs.length) return null;
  return (
    <Box>
      {labs
        .sort((a, b) => {
          const aName = a?.name?.toLowerCase();
          const bName = b?.name?.toLowerCase();
          if (aName! < bName!) return -1;
          if (aName! > bName!) return 1;
          return 0;
        })
        .map((lab) => {
          const trendStatus =
            lab.trendStatus === "INCREASING"
              ? " ↑ "
              : lab.trendStatus === "DECREASING"
                ? " ↓ "
                : "";

          return (
            <CellWithPopper
              key={`${lab.id}`}
              value={renderLabelValue(
                lab.name!,
                <>
                  <SemanticBadge
                    label={`${lab.value}${lab.units !== "%" ? " " : ""}${lab.units ? lab.units : ""} (${lab.normalStatus}) ${trendStatus}`}
                    severity={
                      lab.severity === "C"
                        ? "error"
                        : lab.severity === "A"
                          ? "warning"
                          : "success"
                    }
                    variant={"filled"}
                    icon={false}
                    sx={
                      lab.severity === "N"
                        ? {
                            backgroundColor: "transparent",
                            color: "black",
                            border: "none",
                            fontWeight: 400,
                            mr: 1,
                            mb: 1,
                            px: 0.25,
                          }
                        : {
                            border: "1px solid",
                            fontWeight: lab.severity !== "N" ? 700 : 400,
                            mr: 1,
                            px: 0.25,
                          }
                    }
                  />
                  {lab.comment ? (
                    <Typography component="span" variant="body1" color="blue">
                      *
                    </Typography>
                  ) : null}
                </>,
              )}
              popperTitle={renderPopperTitle(lab)}
              popperContent={renderPopperContent(lab)}
              drawer
            />
          );
        })}
    </Box>
  );
}

export interface LabPanel {
  /** Unique identifier for this lab panel */
  id: number;
  /** ID of the patient this panel belongs to */
  patientId?: number;
  /** Timestamp when the panel became clinically significant */
  clinicalSignificantTime?: string;
  /** Severity code for the panel (e.g. 'C' = Critical) */
  severity?: string;
  /** Normality status description (e.g. 'Critical', 'H', 'N') */
  normalStatus?: string;
  /** Completion status of the panel (e.g. 'FINAL') */
  completedStatus?: string;
  /** Full name of the panel (e.g. 'BMP') */
  name?: string;
  /** Abbreviated name of the panel (e.g. 'BMP') */
  abbrevName?: string;
  /** Ordering provider's last name */
  orderingProviderLastName?: string;
  /** Ordering provider's first name */
  orderingProviderFirstName?: string;
  /** Individual component results within this panel */
  components?: LabComponent[];
  /** Data type, fixed to 'labs' for lab panels */
  dataType?: "labs";
  /** LOINC code for the panel */
  loincCode?: string;
  /** Whether any component in the panel is flagged significant */
  isSignificant?: boolean;
  /** Related reason for the lab panel, if applicable */
  relatedReason?: string;
}

export interface LabComponent {
  /** Unique internal ID for the component */
  id: number;
  /** Date/time of clinical significance, e.g. "02/01/2025 09:30:00 AM" */
  clinicalSignificantTime?: string;
  /** Name of the lab component, e.g. "Na", "K", "Glu" */
  name?: string;
  /** Numeric/string value of the component, e.g. "5.6" */
  value?: string;
  /** Normal range low bound, e.g. "3.6" */
  normalLow?: string;
  /** Normal range high bound, e.g. "5.0" */
  normalHigh?: string;
  /** Units of measurement, e.g. "mEq/L" */
  units?: string;
  /** Severity code, e.g. "C" (critical), "A" (abnormal), "N" (normal) */
  severity?: string;
  /** Descriptive normal status like "HH", "H", "L", "N" */
  normalStatus?: string;
  /** Typically "Final", "Preliminary", etc. */
  completedStatus?: string;
  /** "NEW", or a code indicating how this value trends vs. previous. */
  trendStatus?: string;
  /** Previous value for comparison */
  previousValue?: LabComponent;
  /** (Optional) Additional comment or note about this lab */
  comment?: string;
}

export interface FishboneLabPanelProps {
  labPanel: LabPanel;
}

export const FishboneLabPanel: React.FC<FishboneLabPanelProps> = ({
  labPanel,
}) => {
  const upperName = labPanel.name!.toUpperCase();

  // Create map for quick lookup
  const map: Record<string, LabComponent> = {};
  for (const c of labPanel.components!) {
    map[c.name!.toLowerCase()] = c;
  }

  let leftover: LabComponent[] = [];

  let table: React.ReactNode = null;

  if (isRenderAsChem7(upperName)) {
    const sodiumKeys = ["na", "sodium", "na+", "SODIUM", "NA", "NA+"];
    const sodium = sodiumKeys.map((k) => map[k]).find((v) => v);
    const chlorideKeys = ["cl", "chloride", "cl-", "CHLORIDE", "CL", "CL-"];
    const chloride = chlorideKeys.map((k) => map[k]).find((v) => v);
    const potassiumKeys = ["k", "potassium", "k+", "POTASSIUM", "K", "K+"];
    const potassium = potassiumKeys.map((k) => map[k]).find((v) => v);
    const glucoseKeys = ["glu", "glucose", "GLUCOSE"];
    const glucose = glucoseKeys.map((k) => map[k]).find((v) => v);
    const co2Keys = [
      "co2",
      "CO2",
      "CARBON DIOXIDE",
      "Carbon Dioxide",
      "Carbon dioxide",
    ];
    const co2 = co2Keys.map((k) => map[k]).find((v) => v);
    const creatinineKeys = ["cr", "creatinine", "CREATININE"];
    const creatinine = creatinineKeys.map((k) => map[k]).find((v) => v);
    const bunKeys = ["bun", "BUN"];
    const bun = bunKeys.map((k) => map[k]).find((v) => v);
    const hco3Keys = ["hco3", "HCO3"];
    const hco3 = hco3Keys.map((k) => map[k]).find((v) => v);

    const typicalChem7 = [
      ...sodiumKeys,
      ...chlorideKeys,
      ...bunKeys,
      ...potassiumKeys,
      ...co2Keys,
      ...hco3Keys,
      ...creatinineKeys,
      ...glucoseKeys,
    ];

    leftover = labPanel.components!.filter(
      (c) => !typicalChem7.includes(c.name!.toLowerCase()),
    );
    table = renderChem7(
      sodium,
      chloride,
      bun,
      potassium,
      co2 || hco3,
      creatinine,
      glucose,
    );
  } else if (isRenderAsCBC(upperName)) {
    const wbcKeys = ["wbc", "white blood cell", "WBC", "WHITE BLOOD CELL"];
    const wbc = wbcKeys.map((k) => map[k]).find((v) => v);
    const hbKeys = ["hb", "hemoglobin", "HGB", "HEMOGLOBIN"];
    const hb = hbKeys.map((k) => map[k]).find((v) => v);
    const hctKeys = ["hct", "hematocrit", "HCT", "HEMATOCRIT"];
    const hct = hctKeys.map((k) => map[k]).find((v) => v);
    const pltKeys = [
      "plt",
      "platelet",
      "platelet count",
      "PLT",
      "PLT CNT",
      "PLATELET",
      "PLATELET COUNT",
    ];
    const plt = pltKeys.map((k) => map[k]).find((v) => v);

    const typicalCBC = [...wbcKeys, ...hbKeys, ...hctKeys, ...pltKeys];

    leftover = labPanel.components!.filter(
      (c) => !typicalCBC.includes(c.name!.toLowerCase()),
    );
    table = renderCBC(wbc, hb, hct, plt);
  } else {
    // If not BMP or CBC, treat all as leftover
    leftover = labPanel.components!;
  }

  return (
    <Card
      sx={{
        maxWidth: "100%",
        height: "100%",
        mb: 1,
        p: 1,
      }}
      variant="outlined"
    >
      <CardHeader
        title={
          <CellWithPopper
            value={
              <Typography
                variant="h5"
                sx={{
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#010F0C",
                }}
                data-labs-id={labPanel.id}
              >
                {labPanel.name}
              </Typography>
            }
            popperTitle={
              <Typography
                variant="h5"
                sx={{
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#010F0C",
                }}
              >
                Lab Panel
              </Typography>
            }
            popperContent={<FishboneLabPanel labPanel={labPanel} />}
            drawer
          />
        }
        action={
          <Stack>
            {labPanel.normalStatus ? (
              <SemanticBadge
                label={capitalize(labPanel.normalStatus)}
                severity={
                  labPanel.normalStatus === "Critical"
                    ? "error"
                    : labPanel.normalStatus === "Abnormal"
                      ? "warning"
                      : "success"
                }
                sx={{
                  my: 1,
                  position: "relative",
                }}
              />
            ) : undefined}
            <Typography
              variant="h6"
              sx={{
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "24px",
                color: "#999999",
              }}
            >
              {formatToMilitaryTime(labPanel.clinicalSignificantTime ?? "")}
            </Typography>
          </Stack>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Divider sx={{ mb: 1 }} />
        {labPanel.relatedReason ? (
          <>
            {renderLabelValue("Related Reason", labPanel.relatedReason)}
            <Divider sx={{ mb: 1 }} />
          </>
        ) : null}
        <Box sx={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>
          {table}
        </Box>
        {table && leftover.length > 0 ? <Divider sx={{ my: 1 }} /> : null}
        {/* If no table, show leftover labs in a table */}
        {table ? (
          renderLeftover(leftover)
        ) : (
          <Table
            size="small"
            sx={{
              width: "auto",
              border: "none",
              "& td": { border: "none", p: 0 },
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell rowSpan={2} sx={{ verticalAlign: "middle" }}>
                  {renderLeftover(leftover)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
export default FishboneLabPanel;
FishboneLabPanel.displayName = "FishboneLabPanel";
