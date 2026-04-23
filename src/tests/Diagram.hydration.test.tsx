import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react";
import { Diagram } from "@/components/shared/visualization/Diagram";

class IntersectionObserverMock {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback([{ isIntersecting: false, target } as IntersectionObserverEntry], this as never);
  }

  unobserve() {}

  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe("Diagram hydration stability", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
  });

  it("keeps server/client container ids stable during hydration", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const element = (
      <Diagram
        diagram={'flowchart TB\n  A["One"] --> B["Two"]'}
        showToolbar={false}
        showDots={false}
      />
    );

    const serverMarkup = renderToString(element);
    const host = document.createElement("div");
    host.innerHTML = serverMarkup;

    const serverContainerId = host.querySelector("[id$='-container']")?.getAttribute("id");
    expect(serverContainerId).toBeTruthy();

    await act(async () => {
      hydrateRoot(host, element);
      await Promise.resolve();
    });

    const hydratedContainerId = host.querySelector("[id$='-container']")?.getAttribute("id");
    expect(hydratedContainerId).toBe(serverContainerId);

    const hydrationErrors = consoleErrorSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((message) => message.toLowerCase().includes("hydration"));
    expect(hydrationErrors).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });
});
