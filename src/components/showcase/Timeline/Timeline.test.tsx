// src/components/Timeline/Timeline.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import Timeline, { TimelineEvent, TimelineProps } from "../Timeline";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// wrap with MUI theme so classes/rendering match
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe("Timeline component", () => {
  const baseEvents: TimelineEvent[] = [
    { label: "08:00", title: "Breakfast", content: <div>Eggs</div> },
    { label: "12:00", title: "Lunch", content: <div>Salad</div> },
    { label: "18:00", title: "Dinner", content: <div>Pasta</div> },
  ];

  it("renders skeletons and children when loading", () => {
    const { container } = renderWithTheme(
      <Timeline loading className="my-tl">
        <div data-testid="fallback">Fallback</div>
      </Timeline>,
    );
    // 3 skeletons per item × 3 items = 9 skeleton roots
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons).toHaveLength(9);

    // fallback children still present
    expect(screen.getByTestId("fallback")).toBeInTheDocument();

    // root gets our className
    expect(container.querySelector(".my-tl")).toBeInTheDocument();
  });

  it("renders empty timeline when no events & no children", () => {
    const { container } = renderWithTheme(<Timeline />);
    expect(container.querySelector(".MuiTimeline-root")).toBeInTheDocument();
    // no items inside
    expect(container.querySelectorAll(".MuiTimelineItem-root")).toHaveLength(0);
  });

  it("renders events with correct labels, titles, and content", () => {
    renderWithTheme(<Timeline events={baseEvents} />);

    baseEvents.forEach(({ label, title, content }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(title)).toBeInTheDocument();
      // content is <div>Eggs</div>, <div>Salad</div>, etc.
      expect(
        screen.getByText((content as React.ReactElement).props.children),
      ).toBeInTheDocument();
    });
  });

  it("reverses order when reverseOrder=true", () => {
    renderWithTheme(
      <Timeline events={baseEvents} reverseOrder alignment="right" />,
    );
    // first rendered title should be last event
    const titles = screen.getAllByText(/Breakfast|Lunch|Dinner/);
    expect(titles[0].textContent).toBe("Dinner");
  });

  it.each<{ alignment: TimelineProps["alignment"]; classSuffix: string }>([
    { alignment: "left", classSuffix: "Left" },
    { alignment: "right", classSuffix: "Right" },
    { alignment: "alternate", classSuffix: "Alternate" },
  ])("applies alignment=%s via CSS class", ({ alignment, classSuffix }) => {
    const { container } = renderWithTheme(
      <Timeline events={baseEvents} alignment={alignment} />,
    );
    const root = container.querySelector(".MuiTimeline-root");
    expect(root).toHaveClass(`MuiTimeline-position${classSuffix}`);
  });

  it("uses grey background dot when isPending=true", () => {
    const pendingEvents: TimelineEvent[] = [
      { label: "09:00", title: "Pending", content: null, isPending: true },
    ];
    const { container } = renderWithTheme(<Timeline events={pendingEvents} />);
    const dot = container.querySelector(".MuiTimelineDot-root") as HTMLElement;
    // actual computed style
    const bg = window.getComputedStyle(dot).backgroundColor;
    // MUI grey.400 is rgb(189, 189, 189)
    expect(bg).toBe("rgb(189, 189, 189)");
  });

  it("renders exactly n–1 connectors", () => {
    const { container } = renderWithTheme(<Timeline events={baseEvents} />);
    const connectors = container.querySelectorAll(".MuiTimelineConnector-root");
    expect(connectors).toHaveLength(baseEvents.length - 1);
  });

  it("appends children after events", () => {
    renderWithTheme(
      <Timeline events={baseEvents}>
        <div data-testid="child">End</div>
      </Timeline>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  describe("mermaid parsing", () => {
    const mermaid = `
      timeline
      05/16 12∶30 : Event A: Detail A : notes : 123
      05/16 13∶00:Event B:Detail B : testResults : 123
      05/16 14∶00 : Event C : labs : 123
    `;

    it("overrides events with parsed mermaid lines", () => {
      renderWithTheme(<Timeline mermaid={mermaid} />);
      // due to firstColon logic, label is before first ":", title is text before second ":", detail after
      expect(screen.getByText("05/16 12∶30")).toBeInTheDocument();
      expect(screen.getByText("Event A")).toBeInTheDocument();
      expect(screen.getByText("Detail A")).toBeInTheDocument();

      expect(screen.getByText("05/16 13∶00")).toBeInTheDocument();
      expect(screen.getByText("Event B")).toBeInTheDocument();
      expect(screen.getByText("Detail B")).toBeInTheDocument();

      expect(screen.getByText("05/16 14∶00")).toBeInTheDocument();
      expect(screen.getByText("Event C")).toBeInTheDocument();
    });

    it("respects reverseOrder for mermaid", () => {
      renderWithTheme(
        <Timeline mermaid={mermaid} reverseOrder alignment="right" />,
      );
      // first title now the bad line
      const titles = screen.getAllByText(/Event A|Event B|Event C/);
      expect(titles[0].textContent).toBe("Event C");
    });
  });
});
