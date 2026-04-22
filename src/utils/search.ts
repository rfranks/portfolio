export function filterByText<T>(items: T[], text: string, fields: (keyof T)[]): T[] {
  if (!text) return items;
  const query = text.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(query);
    }),
  );
}

export function filterByTag<T extends { tags: string[] }>(items: T[], tag: string): T[] {
  if (!tag) return items;
  const query = tag.toLowerCase();
  return items.filter((item) => item.tags?.some((t) => t.toLowerCase().includes(query)));
}
