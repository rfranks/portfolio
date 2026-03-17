import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Label,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { gates } from "dnaviz";

import { Sequence } from "@/types/dna/types";
import { getSequenceStrokeStyle } from "@/utils/dna/sequenceUtils";
import { dnaChartTooltipProps } from "./tooltipStyles";

export type GatesChartProps = {
  sequences?: Sequence[] | null;
  bpRange?: number[] | null;
};

export function GatesChart({ sequences = [], bpRange }: GatesChartProps) {
  const theme = useTheme();

  const data: Record<"x" | string, number>[] = [];

  for (let i = 0; i < (sequences?.length || 0); i++) {
    const sequence = sequences?.[i];
    const [xx, yy] = gates(
      sequence?.sequence.substring(
        bpRange?.[0] || 0,
        bpRange?.[1] || sequence.sequence.length
      ) || ""
    );

    xx.forEach(
      (x, index) =>
        (data[index] = {
          ...data[index],
          x,
          [sequence!.description]: yy[index],
        })
    );
  }

  return (
    <ResponsiveContainer minHeight={600}>
      <LineChart
        data={data}
        margin={{
          top: 16,
          right: 16,
          bottom: 24,
          left: 24,
        }}
        height={500}
        width={500}
      >
        <Legend align="center" verticalAlign="top" />
        <XAxis
          dataKey="x"
          stroke={theme.palette.text.secondary}
          style={theme.typography.body2}
        >
          <Label
            angle={0}
            position="bottom"
            style={{
              textAnchor: "middle",
              fill: theme.palette.text.primary,
              ...theme.typography.body1,
            }}
          >
            # of base pairs
          </Label>
        </XAxis>
        <YAxis
          yAxisId="left"
          stroke={theme.palette.text.secondary}
          style={theme.typography.body2}
        >
          <Label
            angle={270}
            position="left"
            style={{
              textAnchor: "middle",
              fill: theme.palette.text.primary,
              ...theme.typography.body1,
            }}
          >
            Score
          </Label>
        </YAxis>
        <Tooltip
          formatter={function (value, name, index) {
            return `${
              sequences?.find((seq) => seq.description === name)?.sequence[
                Math.ceil(index?.payload?.x)
              ]
            }  (${value})`;
          }}
          labelFormatter={(label) =>
            `base pair #${Math.ceil(label) + 1}`
          }
          {...dnaChartTooltipProps}
        />
        {sequences?.map((sequence, index) => (
          (() => {
            const strokeStyle = getSequenceStrokeStyle(index);

            return (
          <Line
            key={`${sequence?.description}-${index}`}
            yAxisId="left"
            isAnimationActive={true}
            dataKey={sequence?.description}
            stroke={strokeStyle.stroke}
            strokeWidth={strokeStyle.strokeWidth}
            dot={false}
            activeDot={{ r: 4 }}
          />
            );
          })()
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
