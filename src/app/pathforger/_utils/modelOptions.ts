export function sortModelIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids.filter((id) => id.trim().length > 0)));
  const preferredOrder = ["gpt-5.2", "gpt-image-1", "gpt-4.1", "gpt-4.1-mini"];

  return unique.sort((left, right) => {
    const leftPreferredIndex = preferredOrder.indexOf(left);
    const rightPreferredIndex = preferredOrder.indexOf(right);

    if (leftPreferredIndex >= 0 || rightPreferredIndex >= 0) {
      if (leftPreferredIndex < 0) {
        return 1;
      }
      if (rightPreferredIndex < 0) {
        return -1;
      }
      return leftPreferredIndex - rightPreferredIndex;
    }

    return left.localeCompare(right);
  });
}
