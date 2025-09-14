import { setOpenAIKey, hasOpenAIKey, autoReply, AutoReplyMessage } from "../../utils/autoReply";

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
});
