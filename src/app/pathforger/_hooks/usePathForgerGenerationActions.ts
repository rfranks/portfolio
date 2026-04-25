"use client";

import * as React from "react";
import { getPathForgerOpenAIKey } from "@/app/pathforger/_utils/openAIKey";
import {
  runPathForgerPremiseStage,
  runPathForgerProtagonistNameStage,
  runPathForgerToneStage,
  runPathForgerVisualStyleStage,
} from "@/app/pathforger/_utils/pipeline";
import {
  PathForgerChapterResult,
  PathForgerImageType,
  PathForgerPipelineResult,
} from "@/app/pathforger/_types/pipeline";
import { ZodError } from "zod";

type OnboardingPayload = Parameters<typeof runPathForgerPremiseStage>[0]["onboarding"];

function resolveGenerationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return "PathForger needs a bit more input context for this auto-generate action. Please try again.";
  }

  if (error instanceof Error) {
    const normalized = error.message.trim().toLowerCase();
    if (
      normalized.includes("too small") ||
      normalized.includes("invalid_type") ||
      normalized.includes("required")
    ) {
      return "PathForger needs a bit more input context for this auto-generate action. Please try again.";
    }
    return error.message;
  }

  return fallback;
}

function rememberRecentGeneratedValue(
  historyRef: React.MutableRefObject<string[]>,
  value: string,
  maxItems = 20,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  historyRef.current = [trimmed, ...historyRef.current.filter((entry) => entry !== trimmed)].slice(
    0,
    maxItems,
  );
}

export interface UsePathForgerGenerationActionsArgs<TActiveRunAction> {
  premise: string;
  setPremise: React.Dispatch<React.SetStateAction<string>>;
  genre: string;
  tone: string;
  setTone: React.Dispatch<React.SetStateAction<string>>;
  setVisualStyle: React.Dispatch<React.SetStateAction<string>>;
  protagonistPreference: string;
  setProtagonistPreference: React.Dispatch<React.SetStateAction<string>>;
  recentGeneratedProtagonistNames: string[];
  setRecentGeneratedProtagonistNames: React.Dispatch<React.SetStateAction<string[]>>;
  recentGeneratedPremises: string[];
  setRecentGeneratedPremises: React.Dispatch<React.SetStateAction<string[]>>;
  buildOnboardingPayload: () => OnboardingPayload;
  resolvedDefaultModel: string;
  setApiKeyReady: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  clearStatusMessages: () => void;
  enqueueStatusMessage: (message: string) => void;
  playUiSound: (audioRef: React.RefObject<HTMLAudioElement | null>) => void;
  wandActionAudioRef: React.RefObject<HTMLAudioElement | null>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveRunAction: React.Dispatch<React.SetStateAction<TActiveRunAction>>;
  imagePromptEditorValue: string;
  editingImagePromptType: PathForgerImageType | null;
  setImagePromptDrafts: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setImagePromptOverrides: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setResult: React.Dispatch<React.SetStateAction<PathForgerPipelineResult | null>>;
  setChapterOnlyResult: React.Dispatch<React.SetStateAction<PathForgerChapterResult | null>>;
  handleCloseImagePromptEditor: () => void;
}

export function usePathForgerGenerationActions<TActiveRunAction>({
  premise,
  setPremise,
  genre,
  tone,
  setTone,
  setVisualStyle,
  protagonistPreference,
  setProtagonistPreference,
  recentGeneratedProtagonistNames,
  setRecentGeneratedProtagonistNames,
  recentGeneratedPremises,
  setRecentGeneratedPremises,
  buildOnboardingPayload,
  resolvedDefaultModel,
  setApiKeyReady,
  setErrorMessage,
  clearStatusMessages,
  enqueueStatusMessage,
  playUiSound,
  wandActionAudioRef,
  setIsRunning,
  setActiveRunAction,
  imagePromptEditorValue,
  editingImagePromptType,
  setImagePromptDrafts,
  setImagePromptOverrides,
  setResult,
  setChapterOnlyResult,
  handleCloseImagePromptEditor,
}: UsePathForgerGenerationActionsArgs<TActiveRunAction>) {
  const recentGeneratedToneHistoryRef = React.useRef<string[]>([]);
  const recentGeneratedVisualStyleHistoryRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    rememberRecentGeneratedValue(recentGeneratedToneHistoryRef, tone);
  }, [tone]);

  const handleUpdateImagePrompt = React.useCallback(() => {
    if (!editingImagePromptType) {
      return;
    }

    const promptType = editingImagePromptType;
    const updatedPrompt = imagePromptEditorValue;

    setImagePromptDrafts((prev) => ({
      ...prev,
      [promptType]: updatedPrompt,
    }));
    setImagePromptOverrides((prev) => ({
      ...prev,
      [promptType]: updatedPrompt,
    }));

    setResult((prev) =>
      prev
        ? {
            ...prev,
            chapter: {
              ...prev.chapter,
              imagePrompts: {
                ...prev.chapter.imagePrompts,
                [promptType]: updatedPrompt,
              },
            },
          }
        : prev,
    );

    setChapterOnlyResult((prev) =>
      prev
        ? {
            ...prev,
            imagePrompts: {
              ...prev.imagePrompts,
              [promptType]: updatedPrompt,
            },
          }
        : prev,
    );

    handleCloseImagePromptEditor();
  }, [
    editingImagePromptType,
    handleCloseImagePromptEditor,
    imagePromptEditorValue,
    setChapterOnlyResult,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setResult,
  ]);

  const handleGenerateProtagonistName = React.useCallback(async () => {
    setErrorMessage("");
    clearStatusMessages();
    playUiSound(wandActionAudioRef);

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setErrorMessage("OpenAI API key is required.");
      setApiKeyReady(false);
      return;
    }

    setIsRunning(true);
    setActiveRunAction("name" as unknown as React.SetStateAction<TActiveRunAction>);

    try {
      const blockedNames = Array.from(
        new Set(
          [protagonistPreference, ...recentGeneratedProtagonistNames]
            .map((name) => name.trim())
            .filter((name) => name.length > 0 && !/^auto-generate/i.test(name)),
        ),
      );

      const generatedName = await runPathForgerProtagonistNameStage(
        {
          apiKey,
          onboarding: buildOnboardingPayload(),
          defaultModel: resolvedDefaultModel,
          forbiddenNames: blockedNames,
          randomnessSeed: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      const resolvedName = generatedName.protagonistName.trim();
      setProtagonistPreference(resolvedName);
      setRecentGeneratedProtagonistNames((prev) => {
        const next = [resolvedName, ...prev.filter((name) => name !== resolvedName)];
        return next.slice(0, 20);
      });
    } catch (error) {
      setErrorMessage(resolveGenerationErrorMessage(error, "Protagonist name generation failed."));
    } finally {
      clearStatusMessages();
      setIsRunning(false);
      setActiveRunAction(null as unknown as React.SetStateAction<TActiveRunAction>);
    }
  }, [
    buildOnboardingPayload,
    clearStatusMessages,
    enqueueStatusMessage,
    playUiSound,
    protagonistPreference,
    recentGeneratedProtagonistNames,
    resolvedDefaultModel,
    setActiveRunAction,
    setApiKeyReady,
    setErrorMessage,
    setIsRunning,
    setProtagonistPreference,
    setRecentGeneratedProtagonistNames,
    wandActionAudioRef,
  ]);

  const runGenerateTone = React.useCallback(
    async (options?: { premiseOverride?: string; visualStyleOverride?: string }) => {
      const effectivePremise = options?.premiseOverride?.trim() ?? premise.trim();
      const effectiveVisualStyle = options?.visualStyleOverride;

      setErrorMessage("");
      clearStatusMessages();
      playUiSound(wandActionAudioRef);

      const apiKey = getPathForgerOpenAIKey().trim();
      if (!apiKey) {
        setErrorMessage("OpenAI API key is required.");
        setApiKeyReady(false);
        return null;
      }

      setIsRunning(true);
      setActiveRunAction("tone" as unknown as React.SetStateAction<TActiveRunAction>);

      try {
        const base = buildOnboardingPayload();
        const blockedTonePhrases = Array.from(
          new Set(
            [tone, ...recentGeneratedToneHistoryRef.current]
              .map((value) => value.trim())
              .filter((value) => value.length > 0),
          ),
        ).slice(0, 20);
        const onboarding: OnboardingPayload = {
          ...base,
          premise: effectivePremise,
          visualStyle:
            typeof effectiveVisualStyle === "string" ? effectiveVisualStyle : base.visualStyle,
        };

        const generatedTone = await runPathForgerToneStage(
          {
            apiKey,
            onboarding,
            defaultModel: resolvedDefaultModel,
            forbiddenPhrases: blockedTonePhrases,
            previousTones: blockedTonePhrases,
          },
          (progress) => {
            enqueueStatusMessage(progress.message);
          },
        );

        const nextTone = generatedTone.tone.trim();
        setTone(nextTone);
        rememberRecentGeneratedValue(recentGeneratedToneHistoryRef, nextTone);
        return nextTone;
      } catch (error) {
        setErrorMessage(resolveGenerationErrorMessage(error, "Tone generation failed."));
        return null;
      } finally {
        clearStatusMessages();
        setIsRunning(false);
        setActiveRunAction(null as unknown as React.SetStateAction<TActiveRunAction>);
      }
    },
    [
      buildOnboardingPayload,
      clearStatusMessages,
      enqueueStatusMessage,
      playUiSound,
      premise,
      resolvedDefaultModel,
      setActiveRunAction,
      setApiKeyReady,
      setErrorMessage,
      setIsRunning,
      setTone,
      tone,
      wandActionAudioRef,
    ],
  );

  const handleGenerateTone = React.useCallback(() => {
    void runGenerateTone();
  }, [runGenerateTone]);

  const runGenerateVisualStyle = React.useCallback(
    async (options?: { premiseOverride?: string; toneOverride?: string }) => {
      const effectivePremise = options?.premiseOverride?.trim() ?? premise.trim();
      const effectiveTone = options?.toneOverride?.trim() ?? tone.trim();

      setErrorMessage("");
      clearStatusMessages();
      playUiSound(wandActionAudioRef);

      const apiKey = getPathForgerOpenAIKey().trim();
      if (!apiKey) {
        setErrorMessage("OpenAI API key is required.");
        setApiKeyReady(false);
        return;
      }

      setIsRunning(true);
      setActiveRunAction("style" as unknown as React.SetStateAction<TActiveRunAction>);

      try {
        const base = buildOnboardingPayload();
        const blockedStylePhrases = Array.from(
          new Set(
            [base.visualStyle, ...recentGeneratedVisualStyleHistoryRef.current]
              .map((value) => value.trim())
              .filter((value) => value.length > 0),
          ),
        ).slice(0, 20);
        const onboarding: OnboardingPayload = {
          ...base,
          premise: effectivePremise,
          tone: effectiveTone,
        };

        const generatedStyle = await runPathForgerVisualStyleStage(
          {
            apiKey,
            onboarding,
            defaultModel: resolvedDefaultModel,
            forbiddenPhrases: blockedStylePhrases,
            previousVisualStyles: blockedStylePhrases,
          },
          (progress) => {
            enqueueStatusMessage(progress.message);
          },
        );

        const nextVisualStyle = generatedStyle.visualStyle.trim();
        setVisualStyle(nextVisualStyle);
        rememberRecentGeneratedValue(recentGeneratedVisualStyleHistoryRef, nextVisualStyle);
      } catch (error) {
        setErrorMessage(resolveGenerationErrorMessage(error, "Style generation failed."));
      } finally {
        clearStatusMessages();
        setIsRunning(false);
        setActiveRunAction(null as unknown as React.SetStateAction<TActiveRunAction>);
      }
    },
    [
      buildOnboardingPayload,
      clearStatusMessages,
      enqueueStatusMessage,
      playUiSound,
      premise,
      resolvedDefaultModel,
      setActiveRunAction,
      setApiKeyReady,
      setErrorMessage,
      setIsRunning,
      setVisualStyle,
      tone,
      wandActionAudioRef,
    ],
  );

  const handleGenerateVisualStyle = React.useCallback(() => {
    void runGenerateVisualStyle();
  }, [runGenerateVisualStyle]);

  const handleGeneratePremise = React.useCallback(async () => {
    setErrorMessage("");
    clearStatusMessages();
    playUiSound(wandActionAudioRef);

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setErrorMessage("OpenAI API key is required.");
      setApiKeyReady(false);
      return null;
    }

    if (!genre.trim()) {
      setErrorMessage("Please choose a genre so PathForger can craft a fitting premise.");
      return null;
    }

    setIsRunning(true);
    setActiveRunAction("premise" as unknown as React.SetStateAction<TActiveRunAction>);

    try {
      const blockedPremisePhrases = Array.from(
        new Set(
          [
            premise,
            ...recentGeneratedPremises,
            "salvage tug",
            "derelict archive",
            "orbital archive",
            "curator-ai",
            "curator ai",
            "neon-lit",
            "neon lit",
            "neon-drenched",
            "neon drenched",
            "neon-soaked",
            "neon soaked",
          ]
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      ).slice(0, 12);
      const previousPremises = Array.from(
        new Set(
          [premise, ...recentGeneratedPremises]
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      ).slice(0, 8);

      const onboarding: OnboardingPayload = {
        ...buildOnboardingPayload(),
        premise: "",
        tone: "",
        visualStyle: "",
      };

      const generatedPremise = await runPathForgerPremiseStage(
        {
          apiKey,
          onboarding,
          defaultModel: resolvedDefaultModel,
          forbiddenPhrases: blockedPremisePhrases,
          previousPremises,
          randomnessSeed: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      const nextPremise = generatedPremise.premise.trim();
      setPremise(nextPremise);

      setRecentGeneratedPremises((prev) => {
        const next = [nextPremise, ...prev.filter((value) => value !== nextPremise)];
        return next.slice(0, 20);
      });

      const nextProtagonistName = generatedPremise.protagonistName.trim();
      const normalizedPremise = nextPremise
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const normalizedProtagonistName = nextProtagonistName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const premiseMentionsGeneratedProtagonist =
        normalizedProtagonistName.length > 0 &&
        normalizedPremise.includes(normalizedProtagonistName);

      if (premiseMentionsGeneratedProtagonist) {
        setProtagonistPreference(nextProtagonistName);
        setRecentGeneratedProtagonistNames((prev) => {
          const next = [
            nextProtagonistName,
            ...prev.filter((name) => name !== nextProtagonistName),
          ];
          return next.slice(0, 20);
        });
      }

      return nextPremise;
    } catch (error) {
      setErrorMessage(resolveGenerationErrorMessage(error, "Premise generation failed."));
      return null;
    } finally {
      clearStatusMessages();
      setIsRunning(false);
      setActiveRunAction(null as unknown as React.SetStateAction<TActiveRunAction>);
    }
  }, [
    buildOnboardingPayload,
    clearStatusMessages,
    enqueueStatusMessage,
    genre,
    playUiSound,
    premise,
    recentGeneratedPremises,
    resolvedDefaultModel,
    setActiveRunAction,
    setApiKeyReady,
    setErrorMessage,
    setIsRunning,
    setPremise,
    setProtagonistPreference,
    setRecentGeneratedPremises,
    setRecentGeneratedProtagonistNames,
    wandActionAudioRef,
  ]);

  return {
    handleUpdateImagePrompt,
    handleGenerateProtagonistName,
    runGenerateTone,
    handleGenerateTone,
    runGenerateVisualStyle,
    handleGenerateVisualStyle,
    handleGeneratePremise,
  };
}
