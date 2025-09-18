import { analyzeOfferWithAI } from "@/components/talentforge/offerAnalysis";
import type { AskOpenAIFunc } from "@/utils/talentforge/utils";

describe("OfferCompare analyzeOfferWithAI", () => {
  it("passes offer context into the OpenAI system message and updates drafts", async () => {
    const setAnalysis = jest.fn();
    const setDrafts = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();
    const addOfferFn = jest.fn();
    const onSave = jest.fn();

    let capturedSystemMessage = "";
    const askMock = jest.fn(async ({
      context,
      user,
      system,
    }: Parameters<AskOpenAIFunc>[0]) => {
      capturedSystemMessage = `Question: ${user}\n\n${system.replaceAll("{{context}}", context)}`;
      return {
        message: JSON.stringify({
          analysis: "New analysis",
          email: "Email draft",
          linkedin: "LinkedIn draft",
          indeed: "Indeed draft",
        }),
      };
    });
    const ask = askMock as unknown as AskOpenAIFunc;

    const offerText = "Offer letter content";
    const compensationDetails = "Compensation breakdown";
    const context = `Offer Letter:\n${offerText}\n\nCurrent Compensation:\n${compensationDetails}`;

    await analyzeOfferWithAI({
      context,
      prompt: "Prompt instructions",
      compensation: compensationDetails,
      setAnalysis,
      setDrafts,
      setError,
      setLoading,
      onSave,
      ask,
      addOfferFn,
    });

    expect(askMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context,
      }),
    );
    expect(capturedSystemMessage).toContain(offerText);
    expect(capturedSystemMessage).toContain(compensationDetails);
    expect(setAnalysis).toHaveBeenCalledWith("New analysis");
    expect(setDrafts).toHaveBeenCalledWith({
      email: "Email draft",
      linkedin: "LinkedIn draft",
      indeed: "Indeed draft",
    });
    expect(addOfferFn).toHaveBeenCalledWith(
      expect.objectContaining({
        compensation: [
          expect.objectContaining({
            notes: compensationDetails,
          }),
        ],
        summary: expect.arrayContaining([
          expect.stringContaining("New analysis"),
          expect.stringContaining("Email draft"),
          expect.stringContaining("LinkedIn draft"),
          expect.stringContaining("Indeed draft"),
        ]),
      }),
    );
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(setError).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("clears loading and surfaces an error when the analysis fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const setAnalysis = jest.fn();
    const setDrafts = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();
    const addOfferFn = jest.fn();
    const onSave = jest.fn();
    const ask = jest
      .fn()
      .mockRejectedValueOnce(new Error("analysis failed"));

    await analyzeOfferWithAI({
      context: "Offer context",
      prompt: "Prompt",
      compensation: "Compensation",
      setAnalysis,
      setDrafts,
      setError,
      setLoading,
      onSave,
      ask,
      addOfferFn,
    });

    expect(setAnalysis).toHaveBeenCalledWith("");
    expect(setDrafts).toHaveBeenCalledWith({
      email: "",
      linkedin: "",
      indeed: "",
    });
    expect(setError).toHaveBeenCalledWith("analysis failed");
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(addOfferFn).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

