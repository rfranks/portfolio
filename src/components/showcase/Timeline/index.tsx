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

export interface TimelineEvent {
  /** Text that appears on the opposite side (e.g. time) */
  label: string;
  /** The main heading of the event */
  title: string;
  /** Whether to render the dot in “pending” (grey) style */
  isPending?: boolean;
  /** Arbitrary JSX to show below the title (action, stats, notes, links, etc.) */
  content: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional category for the event (e.g. "orders", "labs", "testResults", etc.) */
  category?: string;
  /** Optional ID for the corresponding item of the event (e.g. the id of the "testResults" object) */
  itemId?: string;
}

export interface TimelineProps {
  /** Events to render, in order.  One of events or mermaid is required. */
  events?: TimelineEvent[];
  /** Optional Mermaid‐format timeline.  One of mermaid or events is required. */
  mermaid?: string;
  /** Show a loading skeleton instead of real events */
  loading?: boolean;
  /**
   * Where to position items:
   * - `"left"`  will render all entries on the left
   * - `"right"` will render all entries on the right (default)
   * - `"alternate"` will zig-zag entries left/right
   */
  alignment?: "left" | "right" | "alternate";
  /** If true, reverse the order of `events` */
  reverseOrder?: boolean;
  /** Extra className on the root UL */
  className?: string;
  /** Children nodes (e.g. fallback) */
  children?: React.ReactNode;
  /** Icon to show in the timeline dot */
  icon?: (category: string, event: TimelineEvent) => React.ReactNode;
}

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
      .map((line) => {
        // format is expected to be one of "<dateTime>: <title>: <detail>: <category>: <id>"
        // but detail could contain colons, so we need to handle that
        const rawTime = line.slice(0, line.indexOf(":")).trim();
        line = line.slice(line.indexOf(":") + 1);
        const title = line.slice(0, line.indexOf(":")).trim();
        line = line.slice(line.indexOf(":") + 1);
        const id = line.slice(line.lastIndexOf(":") + 1).trim();
        line = line.slice(0, line.lastIndexOf(":"));
        const category = line.slice(line.lastIndexOf(":") + 1).trim();
        line = line.slice(0, line.lastIndexOf(":"));
        const detail = line.trim();

        return {
          label: rawTime,
          title,
          isPending: false,
          category,
          itemId: id,
          content: detail ? (
            <Typography variant="body2">{detail}</Typography>
          ) : null,
          onClick: () => {
            if (category && id) {
              // find the event by data-<category>-id attribute and trigger a click
              const item = document.querySelector(
                `[data-${category}-id="${id}"]`,
              ) as HTMLElement;
              if (item) {
                item.click();
              }
            }
          },
        };
      });
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
          <TimelineOppositeContent
            sx={{ m: "auto 0" }}
            variant="body2"
            color="text.secondary"
          >
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
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: 600 }}
            >
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
