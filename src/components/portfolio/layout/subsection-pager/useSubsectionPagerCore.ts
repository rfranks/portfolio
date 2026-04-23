import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SubsectionPagerItem } from "./types";

type UseSubsectionPagerCoreArgs = {
  items: SubsectionPagerItem[];
  currentKey?: string;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

type UseSubsectionPagerCoreResult = {
  currentIndex: number;
  currentItem: SubsectionPagerItem | undefined;
  hasMultipleItems: boolean;
  selectorAnchorEl: HTMLElement | null;
  selectorOpen: boolean;
  handleSelectorOpen: (event: MouseEvent<HTMLElement>) => void;
  handleSelectorClose: () => void;
  handleSelect: (key: string) => void;
  handlePagerKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export const formatLabel = (index: number, title: string, showOrdinal: boolean) =>
  showOrdinal ? `${index + 1}. ${title}` : title;

export function useSubsectionPagerCore({
  items,
  currentKey,
  onSelect,
  onPrevious,
  onNext,
}: UseSubsectionPagerCoreArgs): UseSubsectionPagerCoreResult {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);
  const selectorOpen = Boolean(selectorAnchorEl);
  const currentIndex = useMemo(() => {
    const matchedIndex = items.findIndex((item) => item.key === currentKey);
    return matchedIndex >= 0 ? matchedIndex : 0;
  }, [currentKey, items]);
  const currentItem = items[currentIndex];
  const hasMultipleItems = items.length > 1;

  useEffect(() => {
    if (!hasMultipleItems) {
      return;
    }

    const handleShortcutPrevious = () => {
      onPrevious();
    };
    const handleShortcutNext = () => {
      onNext();
    };

    window.addEventListener("portfolio:shortcut:sub-prev", handleShortcutPrevious);
    window.addEventListener("portfolio:shortcut:sub-next", handleShortcutNext);
    return () => {
      window.removeEventListener("portfolio:shortcut:sub-prev", handleShortcutPrevious);
      window.removeEventListener("portfolio:shortcut:sub-next", handleShortcutNext);
    };
  }, [hasMultipleItems, onNext, onPrevious]);

  const handleSelectorOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setSelectorAnchorEl(event.currentTarget);
  }, []);

  const handleSelectorClose = useCallback(() => {
    setSelectorAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (key: string) => {
      onSelect(key);
      setSelectorAnchorEl(null);
    },
    [onSelect],
  );

  const handlePagerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectorAnchorEl(event.currentTarget);
      }
    },
    [onNext, onPrevious],
  );

  return {
    currentIndex,
    currentItem,
    hasMultipleItems,
    selectorAnchorEl,
    selectorOpen,
    handleSelectorOpen,
    handleSelectorClose,
    handleSelect,
    handlePagerKeyDown,
  };
}
