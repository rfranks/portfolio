type RevealLike = {
  active: boolean;
  reached: boolean;
};

export function resolveCurrentRevealIndex<TItem extends RevealLike>(labels: TItem[]): number {
  const activeIndex = labels.findIndex((item) => item.active);
  if (activeIndex !== -1) {
    return activeIndex;
  }

  for (let index = labels.length - 1; index >= 0; index -= 1) {
    if (labels[index]?.reached) {
      return index;
    }
  }

  return 0;
}

export function buildCondensedChronologyIndices(params: {
  labelCount: number;
  currentIndex: number;
}): number[] {
  const firstIndex = 0;
  const lastIndex = Math.max(params.labelCount - 1, 0);
  const condensedIndices = new Set([firstIndex, params.currentIndex, lastIndex]);

  if (condensedIndices.size < 3) {
    if (params.currentIndex === firstIndex && firstIndex + 1 < lastIndex) {
      condensedIndices.add(firstIndex + 1);
    }

    if (params.currentIndex === lastIndex && lastIndex - 1 > firstIndex) {
      condensedIndices.add(lastIndex - 1);
    }
  }

  if (condensedIndices.size < 3) {
    const middleIndex = Math.floor((firstIndex + lastIndex) / 2);
    if (middleIndex > firstIndex && middleIndex < lastIndex) {
      condensedIndices.add(middleIndex);
    }
  }

  return Array.from(condensedIndices).sort((left, right) => left - right);
}
