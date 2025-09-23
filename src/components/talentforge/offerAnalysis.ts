import { v4 as uuid } from "uuid";

import type { Offer, ApplicationRecord } from "@/types";
import type { AskOpenAIFunc } from "@/utils/talentforge/utils";
import { describeAskError, type AskErrorInfo } from "@/utils/talentforge/errors";

export type OfferDrafts = {
  email: string;
  linkedin: string;
  indeed: string;
};

export interface AnalyzeOfferOptions {
  context: string;
  prompt: string;
  compensation: string;
  setAnalysis: (value: string) => void;
  setDrafts: (value: OfferDrafts) => void;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  onSave?: () => void;
  ask: AskOpenAIFunc;
  addOfferFn: (offer: Offer) => void;
  onAskError?: (info: AskErrorInfo) => void;
}

export async function analyzeOfferWithAI({
  context,
  prompt,
  compensation,
  setAnalysis,
  setDrafts,
  setError,
  setLoading,
  onSave,
  ask,
  addOfferFn,
  onAskError,
}: AnalyzeOfferOptions) {
  try {
    const response = await ask({
      context,
      user: prompt,
      system:
        [
          "You analyze offers and produce structured response drafts.",
          "Use the following offer and compensation details as context:",
          "{{context}}",
        ].join("\n\n"),
      chatHistory: [],
      returnFirstResponse: true,
    });
    const message = response?.message || "";
    try {
      const parsed = JSON.parse(message) as {
        analysis?: string;
        email?: string;
        linkedin?: string;
        indeed?: string;
      };
      setAnalysis(parsed.analysis || "");
      setDrafts({
        email: parsed.email || "",
        linkedin: parsed.linkedin || "",
        indeed: parsed.indeed || "",
      });
      const offer: Offer = {
        id: uuid(),
        application: {} as ApplicationRecord,
        compensation: [{ type: "note", amount: 0, notes: compensation }],
        summary: [
          `Analysis: ${parsed.analysis || ""}`,
          `Email Draft: ${parsed.email || ""}`,
          `LinkedIn Draft: ${parsed.linkedin || ""}`,
          `Indeed Draft: ${parsed.indeed || ""}`,
        ],
      };
      addOfferFn(offer);
    } catch {
      setAnalysis(message);
      setDrafts({ email: "", linkedin: "", indeed: "" });
      const offer: Offer = {
        id: uuid(),
        application: {} as ApplicationRecord,
        compensation: [{ type: "note", amount: 0, notes: compensation }],
        summary: [message],
      };
      addOfferFn(offer);
    }
    onSave?.();
  } catch (err) {
    console.error("Failed to analyze offer", err);
    const info = describeAskError(err);
    const failureMessage = `Failed to analyze offer. ${info.message}`;
    setAnalysis("");
    setDrafts({ email: "", linkedin: "", indeed: "" });
    setError(failureMessage);
    onAskError?.({ ...info, message: failureMessage });
  } finally {
    setLoading(false);
  }
}

