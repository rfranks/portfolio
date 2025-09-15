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
});

