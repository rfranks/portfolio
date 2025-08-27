/**
 * Sets the title of the document.
 *
 * @returns the `document`'s current title
 */
export function useDocumentTitle(documentTitle?: string): string {
  if (documentTitle) {
    document.title = documentTitle;
  }

  return document.title;
}
