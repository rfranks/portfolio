import {
  buildSequenceAnalysisShareUrl,
  DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
  DNA_ANALYSIS_LEGACY_PRESET_STORAGE_KEY,
  DNA_ANALYSIS_PRESET_STORAGE_KEY,
  loadStoredSequenceAnalysisPresets,
  normalizeSequenceAnalysisRecipeState,
  resolveSequenceAnalysisStateFromSearch,
  upsertSequenceAnalysisPreset,
} from "@/app/dna/_utils/analysisPresetState";
import type { SequenceAnalysisPreset } from "@/app/dna/_types/analysisPresets";

describe("analysisPresetState", () => {
  it("migrates legacy presets into the v2 schema", () => {
    const legacyRaw = JSON.stringify([
      {
        name: "ORF heavy",
        recipeKind: "orf-scan",
        motif: "atg",
        gcWindowSize: 36,
        gcThresholdPct: 25,
        minOrfCodons: 18,
      },
    ]);

    const loaded = loadStoredSequenceAnalysisPresets((storageKey) => {
      if (storageKey === DNA_ANALYSIS_PRESET_STORAGE_KEY) {
        return null;
      }
      if (storageKey === DNA_ANALYSIS_LEGACY_PRESET_STORAGE_KEY) {
        return legacyRaw;
      }
      return null;
    }, "2026-04-24T00:00:00.000Z");

    expect(loaded.migratedFromLegacyStorage).toBe(true);
    expect(loaded.presets).toHaveLength(1);
    expect(loaded.presets[0]).toEqual({
      schemaVersion: 2,
      name: "ORF heavy",
      createdAtIso: "2026-04-24T00:00:00.000Z",
      updatedAtIso: "2026-04-24T00:00:00.000Z",
      state: {
        activeRecipeKind: "orf-scan",
        selectedRecipeKinds: ["orf-scan"],
        motif: "ATG",
        gcWindowSize: 36,
        gcThresholdPct: 25,
        minOrfCodons: 18,
      },
    });
  });

  it("round-trips share links with reproducible recipe state", () => {
    const startState = normalizeSequenceAnalysisRecipeState({
      activeRecipeKind: "gc-anomaly-scan",
      selectedRecipeKinds: ["gc-anomaly-scan", "orf-scan"],
      motif: "TTgA",
      gcWindowSize: 42,
      gcThresholdPct: 22,
      minOrfCodons: 14,
    });

    const shareUrl = buildSequenceAnalysisShareUrl("https://example.com/dna?foo=bar", startState);
    const parsedState = resolveSequenceAnalysisStateFromSearch(new URL(shareUrl).search);

    expect(parsedState).toEqual(
      normalizeSequenceAnalysisRecipeState({
        activeRecipeKind: "gc-anomaly-scan",
        selectedRecipeKinds: ["gc-anomaly-scan", "orf-scan"],
        motif: "TTGA",
        gcWindowSize: 42,
        gcThresholdPct: 22,
        minOrfCodons: 14,
      }),
    );
  });

  it("upserts by name case-insensitively while preserving created timestamp", () => {
    const existingPreset: SequenceAnalysisPreset = {
      schemaVersion: 2,
      name: "Quick Scan",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      state: DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
    };

    const nextPresets = upsertSequenceAnalysisPreset(
      [existingPreset],
      "quick scan",
      {
        ...DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
        activeRecipeKind: "orf-scan",
        selectedRecipeKinds: ["orf-scan", "motif-scan"],
        minOrfCodons: 20,
      },
      "2026-04-24T12:00:00.000Z",
    );

    expect(nextPresets).toHaveLength(1);
    expect(nextPresets[0].name).toBe("quick scan");
    expect(nextPresets[0].createdAtIso).toBe("2026-01-01T00:00:00.000Z");
    expect(nextPresets[0].updatedAtIso).toBe("2026-04-24T12:00:00.000Z");
    expect(nextPresets[0].state.activeRecipeKind).toBe("orf-scan");
    expect(nextPresets[0].state.selectedRecipeKinds).toEqual(["motif-scan", "orf-scan"]);
    expect(nextPresets[0].state.minOrfCodons).toBe(20);
  });
});
