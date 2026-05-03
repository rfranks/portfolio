import type { CommandPaletteAction } from "@/types/components/portfolio";
import { getPortfolioQuickOpenIndexActions } from "@/components/portfolio/projectPageData";

export const STATIC_QUICK_OPEN_ACTIONS: CommandPaletteAction[] =
  getPortfolioQuickOpenIndexActions();
