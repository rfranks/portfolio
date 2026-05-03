"use client";

import * as React from "react";
import MarkdownDialog, {
  type MarkdownDialogProps,
} from "@/components/shared/content/MarkdownDialog";
import { buildStandardTermsOfUseMarkdown } from "@/consts/legal/termsOfUse";

const DEFAULT_CONTACT_EMAIL = "richardfranksjr@hotmail.com";

export type LandingTermsDialogProps = Omit<MarkdownDialogProps, "title" | "content"> & {
  appName: string;
  contactEmail?: string;
  title?: string;
};

export default function LandingTermsDialog({
  appName,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  title = "Terms of Use",
  open = false,
  onClose,
  ...dialogProps
}: LandingTermsDialogProps) {
  const termsMarkdown = React.useMemo(
    () =>
      buildStandardTermsOfUseMarkdown({
        appName,
        contactEmail,
      }),
    [appName, contactEmail],
  );

  return (
    <MarkdownDialog
      open={open}
      onClose={onClose}
      title={title}
      content={termsMarkdown}
      {...dialogProps}
    />
  );
}
