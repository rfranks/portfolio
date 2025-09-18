import { askOpenAI } from "../../utils/talentforge/utils";

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  version: "test-version",
  getDocument: jest.fn(() => ({ promise: Promise.resolve({ numPages: 0 }) })),
}));

jest.mock("../../contexts/OpenAIKeyContext", () => ({
  ensureOpenAIKey: jest.fn(() => "test-api-key"),
  hasOpenAIKey: jest.fn(() => true),
  setOpenAIKey: jest.fn(),
}));

jest.mock("../../consts/talentforge/consts", () => ({
  aiBufferSize: 5,
}));

describe("talentforge askOpenAI", () => {
  const globalWithFetch = global as unknown as { fetch: jest.Mock };

  beforeEach(() => {
    globalWithFetch.fetch = jest.fn();
  });

  test("onPDFProgressChange receives numeric progress for empty context", async () => {
    globalWithFetch.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: "response" },
        }],
      }),
    });

    const onPDFProgressChange = jest.fn();

    await askOpenAI({
      context: "",
      user: "Question?",
      system: "System with {{context}}",
      chatHistory: [],
      onChatHistoryChange: jest.fn(),
      onPDFProgressChange,
    });

    expect(onPDFProgressChange).toHaveBeenCalled();
    const progressValue = onPDFProgressChange.mock.calls[0][0];
    expect(typeof progressValue).toBe("number");
    expect(Number.isNaN(progressValue)).toBe(false);
    expect(progressValue).toBe(100);
  });

  test("propagates errors after partial progress and marks chat history as having more", async () => {
    jest.useFakeTimers();

    try {
      const partialJson = {
        choices: [
          {
            message: { content: "First chunk" },
          },
        ],
      };

      const partialResponse = {
        ok: true,
        json: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(partialJson), 10);
            }),
        ),
      } as unknown as Response;

      const errorResponse = {
        ok: false,
        status: 500,
        text: jest.fn(
          () =>
            new Promise<string>((resolve) => {
              setTimeout(() => resolve("Internal Server Error"), 10);
            }),
        ),
      } as unknown as Response;

      globalWithFetch.fetch
        .mockResolvedValueOnce(partialResponse)
        .mockResolvedValueOnce(errorResponse);

      const onPDFProgressChange = jest.fn();
      const onChatHistoryChange = jest.fn();

      const askPromise = askOpenAI({
        context: "abcdefghij",
        user: "Question?",
        system: "System with {{context}}",
        chatHistory: [],
        onChatHistoryChange,
        onPDFProgressChange,
      });

      const rejectionExpectation = expect(askPromise).rejects.toThrow(
        "Request failed with status 500: Internal Server Error",
      );

      await jest.advanceTimersByTimeAsync(10);
      await jest.advanceTimersByTimeAsync(10);

      await rejectionExpectation;

      expect(globalWithFetch.fetch).toHaveBeenCalledTimes(2);
      expect(onPDFProgressChange).toHaveBeenCalledTimes(1);
      expect(onPDFProgressChange).toHaveBeenCalledWith(50);

      const firstHistoryUpdate = onChatHistoryChange.mock.calls[0]?.[0];
      const assistantEntry = firstHistoryUpdate?.find?.(
        (entry: { role?: string | null }) => entry?.role === "assistant",
      );
      expect(assistantEntry?.hasMore).toBe(true);

      const firstCallArgs = globalWithFetch.fetch.mock.calls[0];
      const secondCallArgs = globalWithFetch.fetch.mock.calls[1];
      const firstBody = JSON.parse(firstCallArgs?.[1]?.body ?? "{}") as {
        messages?: { content?: string }[];
      };
      const secondBody = JSON.parse(secondCallArgs?.[1]?.body ?? "{}") as {
        messages?: { content?: string }[];
      };

      expect(firstBody.messages?.[0]?.content).toContain("abcde");
      expect(firstBody.messages?.[0]?.content).not.toContain("fghij");
      expect(secondBody.messages?.[0]?.content).toContain("fghij");
    } finally {
      jest.useRealTimers();
    }
  });
});
