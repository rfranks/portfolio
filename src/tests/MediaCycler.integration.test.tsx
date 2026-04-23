import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import MediaCycler from "@/components/shared/media/MediaCycler";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";

function buildCustomItem(key: string, label: string, onSelect?: () => void): MediaCyclerItem {
  return {
    key,
    title: label,
    mediaType: "custom",
    mediaUrl: "",
    customContent: <div>{label}</div>,
    onSelect,
  };
}

describe("MediaCycler integration behaviors", () => {
  it("supports swipe navigation when enabled", () => {
    const onSelectFirst = jest.fn();
    const onSelectSecond = jest.fn();
    const items: MediaCyclerItem[] = [
      buildCustomItem("first", "First", onSelectFirst),
      buildCustomItem("second", "Second", onSelectSecond),
    ];

    render(
      <MediaCycler
        items={items}
        singlePanel
        singlePanelActiveKey="first"
        allowSwipe
        showChevronNavigation
        disableTransition
      />,
    );

    const swipeTarget = screen.getAllByText("First")[0].closest("[tabindex='0']") as HTMLElement;
    expect(swipeTarget).toBeTruthy();

    fireEvent.touchStart(swipeTarget, {
      touches: [{ clientX: 260, clientY: 120 }],
    });
    fireEvent.touchMove(swipeTarget, {
      touches: [{ clientX: 140, clientY: 120 }],
    });
    fireEvent.touchEnd(swipeTarget, {
      touches: [],
    });

    expect(onSelectSecond).toHaveBeenCalledTimes(1);
    expect(onSelectFirst).not.toHaveBeenCalled();
  });

  it("hides disabled next chevron when configured", () => {
    const items: MediaCyclerItem[] = [buildCustomItem("only", "Only")];

    render(
      <MediaCycler
        items={items}
        singlePanel
        singlePanelActiveKey="only"
        showChevronNavigation
        hideDisabledNextChevron
        disableChevronNext
        disableTransition
      />,
    );

    expect(screen.queryByLabelText("Next media panel")).toBeNull();
  });

  it("shows loop action and executes custom loop handler", () => {
    const onLoopNavigation = jest.fn();
    const items: MediaCyclerItem[] = [
      buildCustomItem("first", "First", jest.fn()),
      buildCustomItem("second", "Second", jest.fn()),
    ];

    render(
      <MediaCycler
        items={items}
        singlePanel
        singlePanelActiveKey="second"
        showChevronNavigation
        loopNavigation
        onLoopNavigation={onLoopNavigation}
        disableTransition
      />,
    );

    fireEvent.click(screen.getByLabelText("Loop media cycle"));
    expect(onLoopNavigation).toHaveBeenCalledTimes(1);
  });

  it("opens compact metadata dialog on info action", () => {
    const items: MediaCyclerItem[] = [
      {
        ...buildCustomItem("one", "One"),
        mediaCaption: "Compact caption detail",
      },
    ];

    render(
      <MediaCycler
        items={items}
        singlePanel
        singlePanelActiveKey="one"
        compactMetadataOnSmallScreens
        disableTransition
      />,
    );

    fireEvent.click(screen.getByLabelText("Open media details: One"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Compact caption detail")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close media details"));
    const dialogAfterClose = screen.getByRole("dialog");
    expect(within(dialogAfterClose).queryByText("Compact caption detail")).toBeNull();
  });
});
