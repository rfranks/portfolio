import React from "react";

// MUI components (deep imports)
import MuiTimeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { TimelineEvent, TimelineProps } from "@/types/components/shared";
export type { TimelineEvent, TimelineProps } from "@/types/components/shared";

const Timeline: React.FC<TimelineProps> = ({
  events = [],
  mermaid,
  loading = false,
  alignment = "right",
  reverseOrder = false,
  className,
  children,
  icon,
}) => {
  // if a mermaid string was provided, override events
  const parsedEvents: TimelineEvent[] = React.useMemo(() => {
    if (!mermaid) return events;
    return mermaid
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^timeline\b/.test(l))
      .map((line): TimelineEvent | null => {
        // format is expected to be one of "<dateTime>: <title>: <detail>: <category>: <id>"
        // but detail could contain colons, so we need to handle that
        let working = line;

        const firstColon = working.indexOf(":");
        if (firstColon === -1) return null;
        const rawTime = working.slice(0, firstColon).trim();
        working = working.slice(firstColon + 1);

        const secondColon = working.indexOf(":");
        if (secondColon === -1) return null;
        const title = working.slice(0, secondColon).trim();
        working = working.slice(secondColon + 1);

        const lastColon = working.lastIndexOf(":");
        if (lastColon === -1) return null;
        const id = working.slice(lastColon + 1).trim();
        working = working.slice(0, lastColon);

        const penultimateColon = working.lastIndexOf(":");
        if (penultimateColon === -1) return null;
        const category = working.slice(penultimateColon + 1).trim();
        working = working.slice(0, penultimateColon);

        const detail = working.trim();

        return {
          label: rawTime,
          title,
          isPending: false,
          category,
          itemId: id,
          content: detail ? <Typography variant="body2">{detail}</Typography> : null,
          onClick: () => {
            if (category && id) {
              // find the event by data-<category>-id attribute and trigger a click
              const item = document.querySelector(`[data-${category}-id="${id}"]`) as HTMLElement;
              if (item) {
                item.click();
              }
            }
          },
        };
      })
      .filter((e): e is TimelineEvent => e !== null);
  }, [mermaid, events]);

  // if reverseOrder is true, reverse the order of events
  const items = reverseOrder
    ? [...(mermaid ? parsedEvents : events)].reverse()
    : mermaid
      ? parsedEvents
      : events;

  // if loading, show a few skeleton bars
  if (loading) {
    return (
      <MuiTimeline position={alignment} className={className}>
        {[1, 2, 3].map((_, i) => (
          <TimelineItem key={i}>
            <TimelineOppositeContent>
              <Skeleton width={40} />
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot variant="filled" />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Skeleton width="60%" />
              <Box mt={1}>
                <Skeleton width="80%" />
              </Box>
            </TimelineContent>
          </TimelineItem>
        ))}
        {children}
      </MuiTimeline>
    );
  }

  return (
    <MuiTimeline position={alignment} className={className}>
      {items.map((evt, idx) => (
        <TimelineItem
          key={idx}
          onClick={evt.onClick}
          sx={{
            cursor: evt.onClick ? "pointer" : "default",
            "&:hover": {
              backgroundColor: evt.onClick ? "rgba(0, 0, 0, 0.04)" : "inherit",
            },
          }}
        >
          <TimelineOppositeContent sx={{ m: "auto 0" }} variant="body2" color="text.secondary">
            {evt.label}
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot
              variant="filled"
              sx={{
                bgcolor: evt.isPending ? "grey.400" : "primary.main",
              }}
            >
              {icon ? icon(evt.category || "", evt) : null}
            </TimelineDot>
            {idx < items.length - 1 && <TimelineConnector />}
          </TimelineSeparator>

          <TimelineContent sx={{ py: "12px", px: 2 }}>
            <Typography variant="body1" component="span" sx={{ fontWeight: 600 }}>
              {evt.title}
            </Typography>
            <Box mt={1}>{evt.content}</Box>
          </TimelineContent>
        </TimelineItem>
      ))}

      {children}
    </MuiTimeline>
  );
};

export default Timeline;
