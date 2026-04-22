import type { PortfolioSetupCommandHandler } from "./types";

export function createInitCommand(
  runInitMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>,
): PortfolioSetupCommandHandler {
  return async ({ runtimeOptions }) => {
    await runInitMode(runtimeOptions);
  };
}
