export type RouteInteractionBudget = {
  route: string;
  firstPagerMs: number | null;
  firstMediaMs: number | null;
  firstDiagramMs: number | null;
  firstInteractionMs: number | null;
  totalCapturedEvents: number;
};

export type RouteInteractionBudgetSnapshot = {
  generatedAt: string;
  routes: RouteInteractionBudget[];
};
