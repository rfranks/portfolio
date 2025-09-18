import { tagResume } from "../../utils/talentforge/tagging";
import { askOpenAI, hasOpenAIKey } from "../../utils/talentforge/utils";

jest.mock("../../utils/talentforge/utils", () => ({
  askOpenAI: jest.fn(),
  hasOpenAIKey: jest.fn(),
}));

describe("tagResume", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("keyword-only content yields correct tags without calling askOpenAI", async () => {
    (hasOpenAIKey as jest.Mock).mockReturnValue(true);

    const content = "Experienced in React, Node, and AWS services.";
    const tags = await tagResume(content);

    expect(tags).toEqual(["React", "Node", "AWS"]);
    expect(askOpenAI).not.toHaveBeenCalled();
  });

  test("duplicate tags from AI and keywords are merged case-insensitively and capped at five tags", async () => {
    (hasOpenAIKey as jest.Mock).mockReturnValue(true);
    (askOpenAI as jest.Mock).mockResolvedValue({
      message: "React, Python, node, Go, AWS, Vue",
    });

    const content = "React and node developer";
    const tags = await tagResume(content);

    expect(askOpenAI).toHaveBeenCalledTimes(1);
    expect(tags).toEqual(["React", "Node", "Python", "Go", "AWS"]);
  });

  test("retries on network errors before succeeding", async () => {
    jest.useFakeTimers();
    try {
      (hasOpenAIKey as jest.Mock).mockReturnValue(true);

      const networkError = new Error("Temporary network issue") as NodeJS.ErrnoException;
      networkError.code = "ETIMEDOUT";

      (askOpenAI as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ message: "React, GraphQL" });

      const content = "React specialist building GraphQL APIs";
      const taggingPromise = tagResume(content);

      await jest.advanceTimersByTimeAsync(500);

      const tags = await taggingPromise;

      expect(askOpenAI).toHaveBeenCalledTimes(2);
      expect(tags).toEqual(["React", "GraphQL"]);
    } finally {
      jest.useRealTimers();
    }
  });

  test("returns keyword tags when askOpenAI keeps failing", async () => {
    jest.useFakeTimers();
    try {
      (hasOpenAIKey as jest.Mock).mockReturnValue(true);

      const networkError = new Error("Network down") as NodeJS.ErrnoException;
      networkError.code = "ECONNRESET";

      (askOpenAI as jest.Mock).mockRejectedValue(networkError);

      const content = "React and Node engineer";
      const taggingPromise = tagResume(content);

      await jest.advanceTimersByTimeAsync(500);
      await jest.advanceTimersByTimeAsync(1000);

      const tags = await taggingPromise;

      expect(askOpenAI).toHaveBeenCalledTimes(3);
      expect(tags).toEqual(["React", "Node"]);
    } finally {
      jest.useRealTimers();
    }
  });
});

