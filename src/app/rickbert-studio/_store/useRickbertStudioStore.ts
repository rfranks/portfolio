import { create } from "zustand";
import {
  ComicStripSpecSchema,
  type PanelSpec,
  StripInputSchema,
  type ComicStripSpec,
  type ReferenceDocConfig,
  type StripInput,
  type ValidationReport,
} from "@/app/rickbert-studio/_schemas";
import {
  ambientScribeSampleRequest,
  seededMasterPrompt,
  seededReferenceDocs,
} from "@/app/rickbert-studio/_samples/seedContent";
import { parseStripInput } from "@/app/rickbert-studio/_parser";
import { createValidationReport } from "@/app/rickbert-studio/_validation";
import {
  DEFAULT_RENDER_SETTINGS,
  type RenderSettings,
} from "@/app/rickbert-studio/_rendering/layoutEngine";

type StudioTab = "parsed" | "validation" | "render" | "inspector" | "characters" | "final";
type FinalRenderStatus = "idle" | "loading" | "success" | "error";
type CharacterMapEntry = {
  role?: "human" | "device";
  notes?: string;
  aliasOf?: string;
};

type RickbertStudioState = {
  masterPrompt: string;
  referenceDocs: ReferenceDocConfig[];
  stripRequest: string;
  parsedSpec: ComicStripSpec | null;
  renderedSpec: ComicStripSpec | null;
  validationReport: ValidationReport | null;
  renderSettings: RenderSettings;
  activeTab: StudioTab;
  errorMessage: string | null;
  openAIKey: string;
  styleReferenceDataUrl: string | null;
  finalRenderImageDataUrl: string | null;
  finalRenderResponseId: string | null;
  finalRenderStatus: FinalRenderStatus;
  finalRenderError: string | null;
  finalRenderUseOutlineGuide: boolean;
  characterMapOverrides: Record<string, CharacterMapEntry>;
  setMasterPrompt: (value: string) => void;
  setReferenceDoc: (id: string, value: string) => void;
  setStripRequest: (value: string) => void;
  setOpenAIKey: (value: string) => void;
  setStyleReferenceDataUrl: (value: string | null) => void;
  setFinalRenderUseOutlineGuide: (value: boolean) => void;
  setCharacterMapOverrides: (value: Record<string, CharacterMapEntry>) => void;
  parse: () => void;
  validate: () => void;
  render: () => void;
  reset: () => void;
  loadSample: () => void;
  setActiveTab: (tab: StudioTab) => void;
  setRenderSettings: (partial: Partial<RenderSettings>) => void;
  beginFinalRender: () => void;
  completeFinalRender: (imageDataUrl: string, responseId?: string | null) => void;
  failFinalRender: (message: string) => void;
  clearFinalRender: () => void;
  setSpecFromImport: (spec: unknown) => void;
  updatePanelInspector: (
    panelNumber: number,
    patch: Partial<Pick<PanelSpec, "sceneText" | "camera" | "mood" | "labels">>,
  ) => void;
};

function buildStripInput(state: RickbertStudioState): StripInput {
  return StripInputSchema.parse({
    masterPrompt: state.masterPrompt,
    referenceDocs: state.referenceDocs,
    stripRequest: state.stripRequest,
  });
}

function parseSafely(state: RickbertStudioState): ComicStripSpec {
  const characterOverrides = Object.fromEntries(
    Object.entries(state.characterMapOverrides).map(([name, config]) => [
      name,
      config.aliasOf || config.role || config.notes || "custom",
    ]),
  );
  const parsed = parseStripInput(buildStripInput(state), {
    customCharacterNames: Object.keys(state.characterMapOverrides),
    characterOverrides,
  });
  return ComicStripSpecSchema.parse(parsed);
}

function defaultReferenceDocs(): ReferenceDocConfig[] {
  return seededReferenceDocs.map((doc) => ({ ...doc }));
}

export const useRickbertStudioStore = create<RickbertStudioState>((set, get) => ({
  masterPrompt: seededMasterPrompt,
  referenceDocs: defaultReferenceDocs(),
  stripRequest: ambientScribeSampleRequest,
  parsedSpec: null,
  renderedSpec: null,
  validationReport: null,
  renderSettings: DEFAULT_RENDER_SETTINGS,
  activeTab: "parsed",
  errorMessage: null,
  openAIKey: "",
  styleReferenceDataUrl: null,
  finalRenderImageDataUrl: null,
  finalRenderResponseId: null,
  finalRenderStatus: "idle",
  finalRenderError: null,
  finalRenderUseOutlineGuide: false,
  characterMapOverrides: {},
  setMasterPrompt: (value) => set({ masterPrompt: value }),
  setReferenceDoc: (id, value) =>
    set((state) => ({
      referenceDocs: state.referenceDocs.map((doc) =>
        doc.id === id ? { ...doc, content: value } : doc,
      ),
    })),
  setStripRequest: (value) => set({ stripRequest: value }),
  setOpenAIKey: (value) => set({ openAIKey: value }),
  setStyleReferenceDataUrl: (value) => set({ styleReferenceDataUrl: value }),
  setFinalRenderUseOutlineGuide: (value) => set({ finalRenderUseOutlineGuide: value }),
  setCharacterMapOverrides: (value) => set({ characterMapOverrides: value }),
  parse: () => {
    try {
      const parsed = parseSafely(get());
      set({ parsedSpec: parsed, errorMessage: null, activeTab: "parsed" });
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to parse strip input.",
      });
    }
  },
  validate: () => {
    try {
      const state = get();
      const parsed = state.parsedSpec ?? parseSafely(state);
      const report = createValidationReport(parsed);
      set({
        parsedSpec: parsed,
        validationReport: report,
        errorMessage: null,
        activeTab: "validation",
      });
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to run validation.",
      });
    }
  },
  render: () => {
    try {
      const state = get();
      const parsed = state.parsedSpec ?? parseSafely(state);
      const report = state.validationReport ?? createValidationReport(parsed);
      set({
        parsedSpec: parsed,
        validationReport: report,
        renderedSpec: parsed,
        errorMessage: null,
      });
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to render strip.",
      });
    }
  },
  reset: () =>
    set({
      masterPrompt: "",
      referenceDocs: defaultReferenceDocs().map((doc) => ({ ...doc, content: "" })),
      stripRequest: "",
      parsedSpec: null,
      renderedSpec: null,
      validationReport: null,
      renderSettings: DEFAULT_RENDER_SETTINGS,
      activeTab: "parsed",
      errorMessage: null,
      styleReferenceDataUrl: null,
      finalRenderImageDataUrl: null,
      finalRenderResponseId: null,
      finalRenderStatus: "idle",
      finalRenderError: null,
      finalRenderUseOutlineGuide: false,
      characterMapOverrides: {},
    }),
  loadSample: () =>
    set({
      masterPrompt: seededMasterPrompt,
      referenceDocs: defaultReferenceDocs(),
      stripRequest: ambientScribeSampleRequest,
      parsedSpec: null,
      renderedSpec: null,
      validationReport: null,
      errorMessage: null,
      activeTab: "parsed",
      finalRenderImageDataUrl: null,
      finalRenderResponseId: null,
      finalRenderStatus: "idle",
      finalRenderError: null,
      finalRenderUseOutlineGuide: false,
      characterMapOverrides: {},
    }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setRenderSettings: (partial) =>
    set((state) => ({
      renderSettings: {
        ...state.renderSettings,
        ...partial,
      },
    })),
  beginFinalRender: () =>
    set({
      finalRenderStatus: "loading",
      finalRenderError: null,
    }),
  completeFinalRender: (imageDataUrl, responseId) =>
    set({
      finalRenderStatus: "success",
      finalRenderImageDataUrl: imageDataUrl,
      finalRenderResponseId: responseId ?? null,
      finalRenderError: null,
      activeTab: "final",
    }),
  failFinalRender: (message) =>
    set({
      finalRenderStatus: "error",
      finalRenderError: message,
    }),
  clearFinalRender: () =>
    set({
      finalRenderImageDataUrl: null,
      finalRenderResponseId: null,
      finalRenderStatus: "idle",
      finalRenderError: null,
    }),
  setSpecFromImport: (spec) => {
    try {
      const nextSpec = ComicStripSpecSchema.parse(spec);
      set({
        parsedSpec: nextSpec,
        renderedSpec: nextSpec,
        validationReport: createValidationReport(nextSpec),
        errorMessage: null,
        activeTab: "parsed",
      });
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to import ComicStripSpec JSON.",
      });
    }
  },
  updatePanelInspector: (panelNumber, patch) => {
    try {
      const current = get();
      const sourceSpec = current.renderedSpec ?? current.parsedSpec;
      if (!sourceSpec) {
        return;
      }

      const nextSpec = ComicStripSpecSchema.parse({
        ...sourceSpec,
        panels: sourceSpec.panels.map((panel) =>
          panel.panelNumber === panelNumber
            ? {
                ...panel,
                ...patch,
                labels: Array.isArray(patch.labels) ? patch.labels : panel.labels,
              }
            : panel,
        ),
      });

      set({
        parsedSpec: nextSpec,
        renderedSpec: nextSpec,
        validationReport: createValidationReport(nextSpec),
        errorMessage: null,
      });
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to update panel inspector.",
      });
    }
  },
}));
