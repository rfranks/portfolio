import Button from "@mui/material/Button";
import type { ComicStripSpec, PanelSpec } from "@/app/rickbert-studio/_schemas";

type RickbertPanelInspectorProps = {
  visibleSpec: ComicStripSpec | null;
  selectedPanel: PanelSpec | null;
  selectedPanelNumber: number;
  onSelectedPanelNumberChange: (value: number) => void;
  panelSceneDraft: string;
  onPanelSceneDraftChange: (value: string) => void;
  panelCameraDraft: string;
  onPanelCameraDraftChange: (value: string) => void;
  panelMoodDraft: string;
  onPanelMoodDraftChange: (value: string) => void;
  panelLabelsDraft: string;
  onPanelLabelsDraftChange: (value: string) => void;
  onApply: () => void;
  onResetDraft: () => void;
};

export default function RickbertPanelInspector({
  visibleSpec,
  selectedPanel,
  selectedPanelNumber,
  onSelectedPanelNumberChange,
  panelSceneDraft,
  onPanelSceneDraftChange,
  panelCameraDraft,
  onPanelCameraDraftChange,
  panelMoodDraft,
  onPanelMoodDraftChange,
  panelLabelsDraft,
  onPanelLabelsDraftChange,
  onApply,
  onResetDraft,
}: RickbertPanelInspectorProps) {
  if (!visibleSpec || !selectedPanel) {
    return (
      <div className="space-y-3 rounded bg-stone-50 p-3 text-sm">
        <p className="text-xs text-stone-600">
          Parse and render a strip to inspect panel-level scene controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded bg-stone-50 p-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-stone-700">
          Active Panel
          <select
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-xs"
            value={selectedPanelNumber}
            onChange={(event) => onSelectedPanelNumberChange(Number(event.target.value))}
          >
            {visibleSpec.panels.map((panel) => (
              <option key={panel.panelNumber} value={panel.panelNumber}>
                Panel {panel.panelNumber}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-700">
          Camera
          <input
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-xs"
            value={panelCameraDraft}
            onChange={(event) => onPanelCameraDraftChange(event.target.value)}
            placeholder="medium"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-stone-700">
          Mood
          <input
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-xs"
            value={panelMoodDraft}
            onChange={(event) => onPanelMoodDraftChange(event.target.value)}
            placeholder="deadpan"
          />
        </label>
        <label className="text-xs font-semibold text-stone-700">
          Labels (comma-separated)
          <input
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-xs"
            value={panelLabelsDraft}
            onChange={(event) => onPanelLabelsDraftChange(event.target.value)}
            placeholder="office, close-up"
          />
        </label>
      </div>

      <label className="block text-xs font-semibold text-stone-700">
        Scene Text
        <textarea
          className="mt-1 h-28 w-full rounded border border-stone-300 p-2 font-mono text-xs"
          value={panelSceneDraft}
          onChange={(event) => onPanelSceneDraftChange(event.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button size="small" variant="contained" onClick={onApply}>
          Apply Panel Changes
        </Button>
        <Button size="small" variant="outlined" onClick={onResetDraft}>
          Reset Draft
        </Button>
      </div>
    </div>
  );
}
