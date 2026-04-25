export interface StandardTermsOfUseOptions {
  appName: string;
  contactEmail: string;
}

export function buildStandardTermsOfUseMarkdown({
  appName,
  contactEmail,
}: StandardTermsOfUseOptions): string {
  return `

Welcome to ${appName}! These Terms of Use govern your use of ${appName}, an advanced AI-powered tool designed to summarize PDF documents and answer content-specific questions.

By accessing or using ${appName}, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use ${appName}.

### 1. Use of ${appName}

** 1.1 Use License **

- You may use ${appName} solely for your personal or internal business purposes in accordance with these Terms of Use.

- You may not use ${appName} for any unlawful or unauthorized purpose, including but not limited to violating any applicable laws or regulations.

- You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of ${appName} without express written permission from the owner.

### 2. User Content

** 2.1 Ownership of User Content **

- You retain ownership of any content you upload or submit to ${appName} ("User Content").

- By uploading or submitting User Content, you grant ${appName} a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, modify, adapt, display, and perform the User Content in connection with ${appName}'s operation and promotion.

### 3. Privacy

** 3.1 Privacy Policy **

- ${appName} respects your privacy and handles your personal data in accordance with its Privacy Policy.

- By using ${appName}, you consent to the collection, use, and sharing of your information as described in the Privacy Policy.

### 4. Intellectual Property

** 4.1 Ownership of Intellectual Property **

- All content, trademarks, service marks, logos, and other intellectual property rights on ${appName} are the property of their respective owners.

- You may not use any trademarks, service marks, or logos displayed on ${appName} without the prior written consent of the owner.

### 5. Limitation of Liability

** 5.1 Disclaimer of Warranties **

- ${appName} is provided on an "as is" and "as available" basis. We make no warranties or representations about the accuracy or completeness of the content provided by ${appName}.

- In no event shall ${appName} or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of ${appName}.

### 6. Changes to Terms of Use

** 6.1 Modifications **

- ${appName} reserves the right to modify or replace these Terms of Use at any time. Any changes will be effective immediately upon posting the revised Terms of Use on ${appName}.

- Your continued use of ${appName} after any changes to these Terms of Use constitutes your acceptance of the revised terms.

### 7. Governing Law

** 7.1 Jurisdiction **

- These Terms of Use shall be governed by and construed in accordance with the laws of the state of New Hampshire, without regard to its conflict of law provisions.

### 8. Contact Us

- If you have any questions about these Terms of Use, please contact us at [${contactEmail}](mailto:${contactEmail}).
`;
}
