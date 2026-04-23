import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import HomeSectionPager, {
  type HomeSectionPagerItem,
} from "@/components/portfolio/layout/HomeSectionPager";
import SubsectionPager from "@/components/portfolio/layout/SubsectionPager";
import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import MediaCycler from "@/components/shared/media/MediaCycler";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";

const axe = configureAxe({
  rules: {
    region: { enabled: false },
  },
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <main>{ui}</main>
    </ThemeProvider>,
  );

describe("Accessibility audits: pager/dialog/media controls", () => {
  it("passes axe checks for HomeSectionPager including open selector menu state", async () => {
    const onSelectSection = jest.fn();
    const items: HomeSectionPagerItem[] = [
      {
        id: "summary",
        label: "Summary",
        iconType: "emoji",
        icon: "🧾",
      },
      {
        id: "projects",
        label: "Projects",
        iconType: "emoji",
        icon: "🧩",
      },
      {
        id: "contact",
        label: "Contact",
        iconType: "emoji",
        icon: "✉️",
      },
    ];

    const { unmount } = renderWithTheme(
      <HomeSectionPager
        items={items}
        currentSectionId="summary"
        onSelectSection={onSelectSection}
      />,
    );

    await waitFor(async () => {
      const initialResults = await axe(document.body);
      expect(initialResults).toHaveNoViolations();
    });

    fireEvent.click(screen.getByRole("button", { name: /I\. Summary/i }));
    await screen.findByRole("menu");

    const openMenuResults = await axe(document.body);
    expect(openMenuResults).toHaveNoViolations();
    unmount();
  });

  it("passes axe checks for SubsectionPager including open selector menu state", async () => {
    const onSelect = jest.fn();
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const items: SubsectionPagerItem[] = [
      {
        key: "overview",
        title: "Overview",
        optionLabel: "Overview",
        optionIcon: "🔎",
        selectedIcon: "🔎",
      },
      {
        key: "architecture",
        title: "Architecture",
        optionLabel: "Architecture",
        optionIcon: "🏗️",
        selectedIcon: "🏗️",
      },
      {
        key: "demo",
        title: "Demo",
        optionLabel: "Demo",
        optionIcon: "🎬",
        selectedIcon: "🎬",
      },
    ];

    const { unmount } = renderWithTheme(
      <SubsectionPager
        items={items}
        currentKey="overview"
        menuId="test-subsection-menu"
        previousAriaLabel="Previous subsection"
        nextAriaLabel="Next subsection"
        selectorAriaLabel="Open subsection selector"
        onSelect={onSelect}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );

    await waitFor(async () => {
      const initialResults = await axe(document.body);
      expect(initialResults).toHaveNoViolations();
    });

    fireEvent.click(screen.getByRole("button", { name: /1\. Overview/i }));
    await screen.findByRole("menu");

    const openMenuResults = await axe(document.body);
    expect(openMenuResults).toHaveNoViolations();
    unmount();
  });

  it("passes axe checks for MediaCycler controls and metadata dialog state", async () => {
    const onSelectFirst = jest.fn();
    const onSelectSecond = jest.fn();
    const items: MediaCyclerItem[] = [
      {
        key: "panel-one",
        title: "Panel One",
        mediaType: "custom",
        customContent: <div>Panel one content</div>,
        mediaCaption: "First caption",
        mediaSource: "First source",
        onSelect: onSelectFirst,
      },
      {
        key: "panel-two",
        title: "Panel Two",
        mediaType: "custom",
        customContent: <div>Panel two content</div>,
        mediaCaption: "Second caption",
        mediaSource: "Second source",
        onSelect: onSelectSecond,
      },
    ];

    const { unmount } = renderWithTheme(
      <MediaCycler
        items={items}
        singlePanel
        singlePanelActiveKey="panel-two"
        showChevronNavigation
        loopNavigation
        compactMetadataOnSmallScreens
        showCompactInfoButton
        smallScreenInfoBlurb="Additional compact metadata details."
      />,
    );

    await waitFor(async () => {
      const initialResults = await axe(document.body);
      expect(initialResults).toHaveNoViolations();
    });

    fireEvent.click(screen.getByRole("button", { name: /Open media details: Panel Two/i }));
    await screen.findByRole("dialog");

    const dialogResults = await axe(document.body);
    expect(dialogResults).toHaveNoViolations();
    unmount();
  });
});
