import * as React from "react";
import {
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_ONE_OFF_MODEL_ID,
  DEFAULT_TEXT_MODEL_ID,
  defaultModelOptions,
  initialRenderImages,
} from "@/app/pathforger/_consts/consts";
import type {
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPipelineResult,
  PathForgerPitchResult,
  PathForgerChapterResult,
} from "@/app/pathforger/_types/pipeline";
import type { PitchSelectionState } from "@/app/pathforger/_types/pitch";

export function usePathForgerFormState() {
  const [genre, setGenre] = React.useState("Sci-fi");
  const [tone, setTone] = React.useState("");
  const [dangerLevel, setDangerLevel] = React.useState<"Forgiving" | "Risky" | "Deadly">("Risky");
  const [adventureLength, setAdventureLength] = React.useState<
    "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long"
  >("Long");
  const [protagonistPreference, setProtagonistPreference] = React.useState("");
  const [recentGeneratedProtagonistNames, setRecentGeneratedProtagonistNames] = React.useState<
    string[]
  >([]);
  const [recentGeneratedPremises, setRecentGeneratedPremises] = React.useState<string[]>([]);
  const [premise, setPremise] = React.useState("");
  const didAutoGeneratePremiseRef = React.useRef(false);
  const [visualStyle, setVisualStyle] = React.useState("");
  const didAutoGenerateStyleRef = React.useRef(false);
  const didAutoGenerateToneRef = React.useRef(false);
  const previousGenreRef = React.useRef(genre);
  const [pendingGenreAutoRegenerate, setPendingGenreAutoRegenerate] = React.useState(false);
  const [pendingAgeRatingPremiseRegenerate, setPendingAgeRatingPremiseRegenerate] =
    React.useState(false);
  const [romanceMode, setRomanceMode] = React.useState<
    "No romance" | "Optional romance" | "Romance-forward"
  >("Optional romance");
  const [allowPermanentDeath, setAllowPermanentDeath] = React.useState(true);
  const [ageRating, setAgeRating] = React.useState("PG-13");
  const previousAgeRatingRef = React.useRef(ageRating);
  const [personalizedImages, setPersonalizedImages] = React.useState(false);

  const [selectedPitch, setSelectedPitch] = React.useState<PitchSelectionState>("auto");
  const selectedPitchRef = React.useRef<PitchSelectionState>("auto");
  const [defaultModel, setDefaultModel] = React.useState(DEFAULT_ONE_OFF_MODEL_ID);
  const [textModel, setTextModel] = React.useState(DEFAULT_TEXT_MODEL_ID);
  const [imageModel, setImageModel] = React.useState(DEFAULT_IMAGE_MODEL_ID);
  const resolvedDefaultModel =
    defaultModel.trim().length > 0 ? defaultModel.trim() : DEFAULT_ONE_OFF_MODEL_ID;
  const [modelOptions, setModelOptions] = React.useState<string[]>(defaultModelOptions);
  const [loadingModelOptions, setLoadingModelOptions] = React.useState(false);
  const [loadedModelOptions, setLoadedModelOptions] = React.useState(false);
  const [renderImages, setRenderImages] = React.useState(initialRenderImages);

  const [selfieDataUrl, setSelfieDataUrl] = React.useState<string | undefined>();
  const [selfieName, setSelfieName] = React.useState("");
  const [coverImageByPitchKey, setCoverImageByPitchKey] = React.useState<
    Record<string, PathForgerGeneratedImage>
  >({});
  const [pitchInputSignature, setPitchInputSignature] = React.useState<string | null>(null);
  const [pitchOnlyResult, setPitchOnlyResult] = React.useState<PathForgerPitchResult | null>(null);
  const [chapterOnlyResult, setChapterOnlyResult] = React.useState<PathForgerChapterResult | null>(
    null,
  );
  const [result, setResult] = React.useState<PathForgerPipelineResult | null>(null);
  const [imagePromptDrafts, setImagePromptDrafts] = React.useState<
    Partial<Record<PathForgerImageType, string>>
  >({});
  const [imagePromptOverrides, setImagePromptOverrides] = React.useState<
    Partial<Record<PathForgerImageType, string>>
  >({});
  const [editingImagePromptType, setEditingImagePromptType] =
    React.useState<PathForgerImageType | null>(null);
  const [imagePromptEditorValue, setImagePromptEditorValue] = React.useState("");

  const createStoryInputSignature = React.useMemo(
    () =>
      JSON.stringify({
        genre: genre.trim(),
        tone: tone.trim(),
        adventureLength,
        visualStyle: visualStyle.trim(),
        ageRating: ageRating.trim(),
        premise: premise.trim(),
        protagonistPreference: protagonistPreference.trim(),
      }),
    [adventureLength, ageRating, genre, premise, protagonistPreference, tone, visualStyle],
  );

  return {
    genre,
    setGenre,
    tone,
    setTone,
    dangerLevel,
    setDangerLevel,
    adventureLength,
    setAdventureLength,
    protagonistPreference,
    setProtagonistPreference,
    recentGeneratedProtagonistNames,
    setRecentGeneratedProtagonistNames,
    recentGeneratedPremises,
    setRecentGeneratedPremises,
    premise,
    setPremise,
    didAutoGeneratePremiseRef,
    visualStyle,
    setVisualStyle,
    didAutoGenerateStyleRef,
    didAutoGenerateToneRef,
    previousGenreRef,
    pendingGenreAutoRegenerate,
    setPendingGenreAutoRegenerate,
    pendingAgeRatingPremiseRegenerate,
    setPendingAgeRatingPremiseRegenerate,
    romanceMode,
    setRomanceMode,
    allowPermanentDeath,
    setAllowPermanentDeath,
    ageRating,
    setAgeRating,
    previousAgeRatingRef,
    personalizedImages,
    setPersonalizedImages,
    selectedPitch,
    setSelectedPitch,
    selectedPitchRef,
    defaultModel,
    setDefaultModel,
    textModel,
    setTextModel,
    imageModel,
    setImageModel,
    resolvedDefaultModel,
    modelOptions,
    setModelOptions,
    loadingModelOptions,
    setLoadingModelOptions,
    loadedModelOptions,
    setLoadedModelOptions,
    renderImages,
    setRenderImages,
    selfieDataUrl,
    setSelfieDataUrl,
    selfieName,
    setSelfieName,
    coverImageByPitchKey,
    setCoverImageByPitchKey,
    pitchInputSignature,
    setPitchInputSignature,
    pitchOnlyResult,
    setPitchOnlyResult,
    chapterOnlyResult,
    setChapterOnlyResult,
    result,
    setResult,
    imagePromptDrafts,
    setImagePromptDrafts,
    imagePromptOverrides,
    setImagePromptOverrides,
    editingImagePromptType,
    setEditingImagePromptType,
    imagePromptEditorValue,
    setImagePromptEditorValue,
    createStoryInputSignature,
  };
}
