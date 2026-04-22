"use client";

import * as React from "react";
import PathForgerControlsDialog from "@/app/pathforger/_components/PathForgerControlsDialog";
import PathForgerImagePromptEditorDialog from "@/app/pathforger/_components/PathForgerImagePromptEditorDialog";
import PathForgerRenderImageCallsDialog from "@/app/pathforger/_components/PathForgerRenderImageCallsDialog";
import PathForgerSelectedPitchDialog from "@/app/pathforger/_components/PathForgerSelectedPitchDialog";
import PathForgerSettingsDialog from "@/app/pathforger/_components/PathForgerSettingsDialog";

type ControlsDialogProps = React.ComponentProps<typeof PathForgerControlsDialog>;
type SettingsDialogProps = React.ComponentProps<typeof PathForgerSettingsDialog>;
type RenderImageCallsDialogProps = React.ComponentProps<typeof PathForgerRenderImageCallsDialog>;
type SelectedPitchDialogProps = React.ComponentProps<typeof PathForgerSelectedPitchDialog>;
type ImagePromptEditorDialogProps = React.ComponentProps<typeof PathForgerImagePromptEditorDialog>;

export interface PathForgerDialogControllerProps {
  controlsDialog: ControlsDialogProps;
  settingsDialog: SettingsDialogProps;
  renderImageCallsDialog: RenderImageCallsDialogProps;
  selectedPitchDialog: SelectedPitchDialogProps;
  imagePromptEditorDialog: ImagePromptEditorDialogProps;
}

export default function PathForgerDialogController({
  controlsDialog,
  settingsDialog,
  renderImageCallsDialog,
  selectedPitchDialog,
  imagePromptEditorDialog,
}: PathForgerDialogControllerProps) {
  return (
    <>
      <PathForgerControlsDialog {...controlsDialog} />
      <PathForgerSettingsDialog {...settingsDialog} />
      <PathForgerRenderImageCallsDialog {...renderImageCallsDialog} />
      <PathForgerSelectedPitchDialog {...selectedPitchDialog} />
      <PathForgerImagePromptEditorDialog {...imagePromptEditorDialog} />
    </>
  );
}
