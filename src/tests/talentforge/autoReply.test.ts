import {
  setOpenAIKey,
  hasOpenAIKey,
  autoReply,
  AutoReplyMessage,
  buildAutoReplyMessages,
  AUTO_REPLY_TEMPLATES,
} from "../../utils/autoReply";

describe("autoReply utilities", () => {
  const globalWithFetch = global as unknown as { fetch: jest.Mock };

  beforeEach(() => {
    globalWithFetch.fetch = jest.fn();
    setOpenAIKey("");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    delete globalWithFetch.fetch;
  });

  test("setOpenAIKey and hasOpenAIKey", () => {
    expect(hasOpenAIKey()).toBe(false);
    setOpenAIKey("abc");
    expect(hasOpenAIKey()).toBe(true);
    setOpenAIKey(" ");
    expect(hasOpenAIKey()).toBe(false);
  });

  test("autoReply returns trimmed string content", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: " hello " } }] }),
    });
    setOpenAIKey("key");
    const result = await autoReply([]);
    expect(result).toBe("hello");
    expect(fetch).toHaveBeenCalled();
  });

  test("autoReply joins array content", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: ["foo ", { text: "bar" }, { other: "" }] } }],
      }),
    });
    setOpenAIKey("key");
    const result = await autoReply([] as AutoReplyMessage[]);
    expect(result).toBe("foo bar ");
  });

  test("autoReply throws on failed fetch response", async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({}) });
    setOpenAIKey("key");
    await expect(autoReply([])).rejects.toThrow("Failed to fetch auto reply");
  });

  test("autoReply propagates fetch rejection", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("network error"));
    setOpenAIKey("key");
    await expect(autoReply([])).rejects.toThrow("network error");
  });

  test("buildAutoReplyMessages creates system and user messages", () => {
    const messages = buildAutoReplyMessages(
      "politeDecline",
      "We are unable to proceed.",
    );
    expect(messages).toEqual([
      {
        role: "system",
        content: AUTO_REPLY_TEMPLATES.politeDecline,
      },
      { role: "user", content: "We are unable to proceed." },
    ]);
  });
});
