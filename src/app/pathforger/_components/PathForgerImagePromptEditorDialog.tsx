import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

type PathForgerImagePromptEditorDialogProps = {
  open: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onUpdate: () => void;
};

export default function PathForgerImagePromptEditorDialog(
  props: PathForgerImagePromptEditorDialogProps,
) {
  const { open, title, value, onChange, onClose, onUpdate } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Edit the image prompt for this part of the story.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Run the pipeline to generate image prompts, or write one here."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onUpdate}>
          Update Prompt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
