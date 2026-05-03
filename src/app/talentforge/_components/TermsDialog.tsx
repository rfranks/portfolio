import { LandingTermsDialog, type LandingTermsDialogProps } from "@/components/shared";

export type TermsDialogProps = Omit<LandingTermsDialogProps, "appName">;

export default function TermsDialog({ open = false, onClose, ...dialogProps }: TermsDialogProps) {
  return (
    <LandingTermsDialog appName="TalentForge" open={open} onClose={onClose} {...dialogProps} />
  );
}
