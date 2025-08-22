import * as React from "react";
import Markdown from "react-markdown";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  DialogProps,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const terms = `

Welcome to Bookworm! These Terms of Use govern your use of Bookworm, an advanced AI-powered tool designed to summarize PDF documents and answer content-specific questions.

By accessing or using Bookworm, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use Bookworm.

### 1. Use of Bookworm

** 1.1 Use License **

- You may use Bookworm solely for your personal or internal business purposes in accordance with these Terms of Use.

- You may not use Bookworm for any unlawful or unauthorized purpose, including but not limited to violating any applicable laws or regulations.

- You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of Bookworm without express written permission from the owner.

### 2. User Content

** 2.1 Ownership of User Content **

- You retain ownership of any content you upload or submit to Bookworm ("User Content").

- By uploading or submitting User Content, you grant Bookworm a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, modify, adapt, display, and perform the User Content in connection with Bookworm's operation and promotion.

### 3. Privacy

** 3.1 Privacy Policy **

- Bookworm respects your privacy and handles your personal data in accordance with its Privacy Policy.

- By using Bookworm, you consent to the collection, use, and sharing of your information as described in the Privacy Policy.

### 4. Intellectual Property

** 4.1 Ownership of Intellectual Property **

- All content, trademarks, service marks, logos, and other intellectual property rights on Bookworm are the property of their respective owners.

- You may not use any trademarks, service marks, or logos displayed on Bookworm without the prior written consent of the owner.

### 5. Limitation of Liability

** 5.1 Disclaimer of Warranties **

- Bookworm is provided on an "as is" and "as available" basis. We make no warranties or representations about the accuracy or completeness of the content provided by Bookworm.

- In no event shall Bookworm or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of Bookworm.

### 6. Changes to Terms of Use

** 6.1 Modifications **

- Bookworm reserves the right to modify or replace these Terms of Use at any time. Any changes will be effective immediately upon posting the revised Terms of Use on Bookworm.

- Your continued use of Bookworm after any changes to these Terms of Use constitutes your acceptance of the revised terms.

### 7. Governing Law

** 7.1 Jurisdiction **

- These Terms of Use shall be governed by and construed in accordance with the laws of the state of New Hampshire, without regard to its conflict of law provisions.

### 8. Contact Us

- If you have any questions about these Terms of Use, please contact us at [richardfrankskr@hotmail.com](mailto:richardfranksjr@hotmail.com).
`;

export interface TermsDialogProps
  extends Omit<DialogProps, "open" | "onClose"> {
  /**
   * If `true`, the dialog is open.
   */
  open?: boolean;
  /**
   * Callback fired when the component requests to be closed.
   */
  onClose?: () => void;
}

export default function TermsDialog({
  open = false,
  onClose,
}: TermsDialogProps) {
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Terms of Use</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>
      <DialogContent>
        <Markdown>{terms}</Markdown>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
