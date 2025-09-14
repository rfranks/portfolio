# Accessibility Audit

## Overview
An accessibility audit was attempted on the TalentForge pages using the Axe CLI. The CLI installation failed with an HTTP 403 error, indicating the package registry was inaccessible from the current environment.

## Implemented Improvements
- Labeled the main navigation toolbar and added ARIA labels to the Sign In and Sign Up buttons.
- Added ARIA labels to the user question input and all file upload controls, including the Browse and Remove File buttons.
- Marked the application status selector with an ARIA label.
- Labeled the newsletter subscription button for screen readers.

## Next Steps
Once the CLI access issue is resolved, run Axe against `/talentforge` and `/talentforge/applications` to validate accessibility and address any remaining issues.
