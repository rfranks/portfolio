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

  test("setOpenAIKey and hasOpenAIKey", () => {
    expect(hasOpenAIKey()).toBe(false);
    setOpenAIKey("abc");
    expect(hasOpenAIKey()).toBe(true);
    setOpenAIKey(" ");
    expect(hasOpenAIKey()).toBe(false);
  });

  test("autoReply returns trimmed string content", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: " hello " } }] }),
    });
    setOpenAIKey("key");
    const result = await autoReply([]);
    expect(result).toBe("hello");
    expect(fetch).toHaveBeenCalled();
  });

  test("autoReply joins array content", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: ["foo ", { text: "bar" }, { other: "" }] } }],
      }),
    });
    setOpenAIKey("key");
    const result = await autoReply([] as AutoReplyMessage[]);
    expect(result).toBe("foo bar ");
  });

  test("autoReply throws on non-ok response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "bad",
    });
    setOpenAIKey("key");
    await expect(autoReply([])).rejects.toThrow("OpenAI request failed");
  });

  test("autoReply throws on invalid JSON", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("invalid json");
      },
    });
    setOpenAIKey("key");
    await expect(autoReply([])).rejects.toThrow("Failed to parse OpenAI response");
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

  test("buildAutoReplyMessages supports polite follow-up", () => {
    const messages = buildAutoReplyMessages(
      "politeFollowUp",
      "Just checking in.",
    );
    expect(messages).toEqual([
      {
        role: "system",
        content: AUTO_REPLY_TEMPLATES.politeFollowUp,
      },
      { role: "user", content: "Just checking in." },
    ]);
  });
});
