import { analyzeOfferWithAI } from "@/components/talentforge/offerAnalysis";

describe("OfferCompare analyzeOfferWithAI", () => {
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

