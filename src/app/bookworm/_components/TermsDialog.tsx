import * as React from "react";
import { MarkdownDialog, type MarkdownDialogProps } from "@/components/shared";
import { buildStandardTermsOfUseMarkdown } from "@/consts/legal/termsOfUse";

const terms = buildStandardTermsOfUseMarkdown({
  appName: "Bookworm",
  contactEmail: "richardfranksjr@hotmail.com",
});

export type TermsDialogProps = Omit<MarkdownDialogProps, "title" | "content">;

export default function TermsDialog({ open = false, onClose, ...dialogProps }: TermsDialogProps) {
  return (
    <MarkdownDialog
      open={open}
      onClose={onClose}
      title="Terms of Use"
      content={terms}
      {...dialogProps}
    />
  );
}
