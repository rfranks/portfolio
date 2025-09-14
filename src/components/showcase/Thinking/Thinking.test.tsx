// src/components/showcase/Thinking/Thinking.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { Thinking, ThinkingProps } from "@components/Thinking";
import "@testing-library/jest-dom";

describe("<Thinking />", () => {
  const renderComponent = (props: Partial<ThinkingProps> = {}) => {
    return render(<Thinking {...props} />);
  };

  it("renders default text and no spinner", () => {
    renderComponent();
    // default text
    const div = screen.getByText("Thinking...");
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass("thinking-effect");
    // no CircularProgress by default
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("renders custom text", () => {
    renderComponent({ text: "Loading data" });
    expect(screen.getByText("Loading data")).toBeInTheDocument();
  });

  it("shows the spinner when showIndicator is true", () => {
    renderComponent({ showIndicator: true });
    // CircularProgress has role="progressbar"
    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
  });

  it("passes custom indicatorProps through to the CircularProgress", () => {
    const custom: ThinkingProps["indicatorProps"] = {
      size: 32,
    };
    renderComponent({ showIndicator: true, indicatorProps: custom });
    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: "32px", height: "32px" });
  });
});
