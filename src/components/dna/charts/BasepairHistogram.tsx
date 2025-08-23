import { useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import Grid from "@mui/material/Grid";

import { Sequence } from "@/types/dna/types";
import {
  baseToColor,
  getBasepairCounts,
  getSequenceColor,
} from "@/utils/dna/sequenceUtils";

export type BasepairHistogramProps = {
  sequences?: Sequence[] | null;
  bpRange?: number[] | null;
};

export function BasepairHistogram(props: BasepairHistogramProps) {
  const { sequences = [], bpRange = [] } = props || {};

  debugger;

  const ref = useRef<HTMLDivElement | null>(null);

  if (!sequences) {
    return null;
  }

  const minBasePair = bpRange?.[0] || 1;
  const bpCounts = getBasepairCounts(
    sequences
      .map((seq) =>
        seq.sequence.substring(
          Math.max(minBasePair - 1, 0),
          (bpRange?.[1] || seq.sequence.length) + 1
        )
      )
      .join("")
  );

  let totalBasePairs = 0;

  sequences.forEach((seq) => {
    const seqBPCounts = getBasepairCounts(
      seq.sequence.substring(
        Math.max(minBasePair - 1) || 0,
        (bpRange?.[1] || seq.sequence.length) + 1
      )
    );

    seqBPCounts.forEach((seqBPCount, index) => {
      bpCounts[index][seq.description] = seqBPCount.count;
    });

    totalBasePairs += seq.sequence.length;
  });

  const firstBar = bpCounts?.slice(0, 1);

  const sequence = sequences?.[0];

  return (
    <Grid container ref={ref}>
      <Grid item>
        <BarChart
          width={(ref.current?.offsetWidth || 0) * 0.75}
          height={300}
          data={bpCounts}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={20}
        >
          <XAxis dataKey="name" padding={{ left: 10, right: 10 }} />
          <YAxis />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={(value) => `${value} bps`}
          />
          <Legend align="center" />
          <CartesianGrid strokeDasharray="3 3" />
          {sequences.map((seq, index) => (
            <Bar
              key={`${seq.description}-${index}`}
              dataKey={seq.description}
              fill={getSequenceColor(index)}
              label={"# of basepairs"}
            />
          ))}
        </BarChart>
      </Grid>
      <Grid item>
        <BarChart
          width={(ref.current?.offsetWidth || 0) * 0.25}
          height={300}
          data={firstBar}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={50}
        >
          <XAxis dataKey="type" padding={{ left: 10, right: 10 }} />
          <YAxis domain={[0, totalBasePairs]} />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={(value) => `${value} bps`}
          />
          <Legend align="center" />
          <CartesianGrid strokeDasharray="3 3" />
          <Bar dataKey="A" stackId="a" fill={baseToColor("A")} />
          <Bar dataKey="C" stackId="a" fill={baseToColor("C")} />
          <Bar dataKey="G" stackId="a" fill={baseToColor("G")} />
          {sequence.type === "DNA" && (
            <Bar dataKey="T" stackId="a" fill={baseToColor("T")} />
          )}
          {sequence.type === "RNA" && (
            <Bar dataKey="U" stackId="a" fill={baseToColor("U")} />
          )}
        </BarChart>
      </Grid>
      <Grid item>
        <RadarChart
          data={bpCounts}
          height={(ref.current?.offsetWidth || 0) * 0.5}
          width={(ref.current?.offsetWidth || 0) * 0.5}
        >
          <Tooltip cursor={{ fill: "transparent" }} />
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          {sequences.map((seq, index) => (
            <Radar
              key={`${seq.description}-${index}`}
              name={seq.description}
              dataKey={seq.description}
              fill={getSequenceColor(index)}
              fillOpacity={0.5}
            />
          ))}
        </RadarChart>
      </Grid>
      <Grid item>
        <BarChart
          width={(ref.current?.offsetWidth || 0) * 0.5}
          height={(ref.current?.offsetWidth || 0) * 0.5}
          data={firstBar}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={60}
        >
          <XAxis dataKey="GC %Label" padding={{ left: 10, right: 10 }} />
          <YAxis min={0} max={100} />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={function (value) {
              return `${value}%`;
            }}
          />
          <Legend align="center" />
          <CartesianGrid strokeDasharray="3 3" />
          <Bar dataKey="GC %" stackId="a" fill={baseToColor("A")} />
        </BarChart>
      </Grid>
    </Grid>
  );
}
