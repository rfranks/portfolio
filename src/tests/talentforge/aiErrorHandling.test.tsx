import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";

import CompareOffers from "@/components/talentforge/offers/CompareOffers";
import OfferCompare from "@/components/talentforge/OfferCompare";
import ToastProvider from "@/components/talentforge/ToastProvider";
import { OpenAIKeyProvider } from "@/contexts/OpenAIKeyContext";
import { askOpenAI } from "@/utils/talentforge/utils";
import { mockRouter } from "next/navigation";

jest.mock("@/components/talentforge/RequireAIKey", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/utils/talentforge/dataStore", () => {
  const offers = [
    {
      id: "offer-a",
      application: { role: { title: "Engineer", company: "Acme" } },
      compensation: [{ type: "salary", amount: 120000, notes: "" }],
      summary: ["Offer A"],
    },
    {
      id: "offer-b",
      application: { role: { title: "Engineer", company: "Globex" } },
      compensation: [{ type: "salary", amount: 110000, notes: "" }],
      summary: ["Offer B"],
    },
  ];
  return {
    getOffers: jest.fn(() => offers),
    addOffer: jest.fn(),
  };
});

jest.mock("@/utils/talentforge/promptRegistry", () => ({
  getPromptTile: jest.fn(() => ({
    id: "compareOffers",
    display: "Analyze Offers",
    description: "",
    contexts: ["offers"],
    inputs: ["offerA", "offerB"],
    fullPrompt: "Prompt with {{offerA}} and {{offerB}}",
  })),
}));

jest.mock("@/utils/talentforge/utils", () => ({
  askOpenAI: jest.fn(),
  pdfToMarkdown: jest.fn(),
}));

jest.mock("@/components/talentforge/FileUploader", () => ({
  __esModule: true,
  default: ({
    onChange,
  }: {
    onChange?: (
      value:
        | File[]
        | string
        | { filename: string; type: string; content: string }
        | undefined,
    ) => void;
  }) => (
    <textarea
      aria-label="Offer letter"
      onChange={(event) => {
        const text = event.target.value;
        const fakeFile = {
          type: "text/plain",
          async text() {
            return text;
          },
        } as unknown as File;
        onChange?.([fakeFile]);
      }}
    />
  ),
}));

jest.mock("@/contexts/TalentForgeDataContext", () => ({
  useTalentForgeData: () => ({
    addMessage: jest.fn(),
    getThreads: () => [],
    getJobApplications: () => [],
    getRecruiters: () => [],
    getAutoReplyTemplates: () => ({}),
  }),
}));

const askOpenAIMock = askOpenAI as jest.Mock;

type RenderResult = {
  container: HTMLElement;
  root: Root;
  unmount: () => void;
};

const renderWithProviders = (ui: React.ReactElement): RenderResult => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <OpenAIKeyProvider>
        <ToastProvider>{ui}</ToastProvider>
      </OpenAIKeyProvider>,
    );
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const waitFor = async (assertion: () => void, timeoutMs = 3000) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - start > timeoutMs) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
};

describe("AI error handling toasts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockReset();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("CompareOffers surfaces retry toast when OpenAI fails", async () => {
    askOpenAIMock.mockRejectedValue(new Error("network down"));

    const { container, unmount } = renderWithProviders(<CompareOffers />);

    const analyzeButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => /analyze offers/i.test(button.textContent ?? ""));
    expect(analyzeButton).toBeDefined();

    await waitFor(() => {
      expect(analyzeButton?.getAttribute("disabled")).toBeNull();
    });

    await act(async () => {
      analyzeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(askOpenAIMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(document.body.textContent).toContain("Unable to generate comparison");
    });

    const toast = document.querySelector('[data-testid="toast-alert"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent ?? "").toContain("network down");

    const retryButton = Array.from(toast!.querySelectorAll("button")).find(
      (button) => /retry/i.test(button.textContent ?? ""),
    );
    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(askOpenAIMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(
        document.querySelector('[aria-label="Generating offer comparison"]'),
      ).toBeNull();
    });

    unmount();
  });

  test("OfferCompare directs the user to settings when the key is missing", async () => {
    askOpenAIMock.mockRejectedValue(new Error("OpenAI API key is not set"));

    const { container, unmount } = renderWithProviders(<OfferCompare />);

    const textareas = Array.from(container.querySelectorAll("textarea"));
    expect(textareas.length).toBeGreaterThanOrEqual(2);

    await act(async () => {
      textareas[0].value = "Offer details";
      textareas[0].dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      textareas[1].value = "Current compensation";
      textareas[1].dispatchEvent(new Event("input", { bubbles: true }));
    });

    const analyzeButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => /analyze offer/i.test(button.textContent ?? ""));
    expect(analyzeButton).toBeDefined();

    await waitFor(() => {
      expect(analyzeButton?.getAttribute("disabled")).toBeNull();
    });

    await act(async () => {
      analyzeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      const element = document.querySelector('[data-testid="toast-alert"]');
      expect(element).not.toBeNull();
    });

    const toastElement = document.querySelector('[data-testid="toast-alert"]');
    expect(toastElement?.textContent ?? "").toContain(
      "Failed to analyze offer. Add your OpenAI API key in Settings to use this feature.",
    );

    const openSettingsButton = Array.from(
      toastElement!.querySelectorAll("button"),
    ).find((button) => /open settings/i.test(button.textContent ?? ""));
    expect(openSettingsButton).toBeDefined();

    await act(async () => {
      openSettingsButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/talentforge/settings");

    unmount();
  });
});
