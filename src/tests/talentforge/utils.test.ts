import { askOpenAI } from "../../utils/talentforge/utils";

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  version: "test-version",
  getDocument: jest.fn(() => ({ promise: Promise.resolve({ numPages: 0 }) })),
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
});
