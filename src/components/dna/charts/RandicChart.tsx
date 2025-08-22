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
import { randic } from "dnaviz";

import { Sequence } from "@/types/dna/types";
import { getSequenceColor } from "@/utils/dna/sequenceUtils";

export type RandicChartProps = {
  sequences?: Sequence[] | null;
  bpRange?: number[] | null;
};

export function RandicChart({ sequences = [], bpRange }: RandicChartProps) {
  const theme = useTheme();

  const data: Record<"x" | string, number>[] = [];

  for (let i = 0; i < (sequences?.length || 0); i++) {
    const sequence = sequences?.[i];
    const [xx, yy] = randic(
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
            # of basepairs
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
            debugger;

            return `${
              sequences?.find((seq) => seq.description === name)?.sequence[
                Math.ceil(index?.payload?.x)
              ]
            }  (${value})`;
          }}
          labelFormatter={(label, payload) =>
            `basepair #${Math.ceil(label) + 1}`
          }
        />
        {sequences?.map((sequence, index) => (
          <Line
            yAxisId="left"
            isAnimationActive={true}
            dataKey={sequence?.description}
            stroke={getSequenceColor(index)}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
