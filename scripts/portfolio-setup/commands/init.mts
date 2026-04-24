import type { PortfolioSetupCommandHandler } from "./types.mts";

export function createInitCommand(
  runInitMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>,
): PortfolioSetupCommandHandler {
  return async ({ runtimeOptions }) => {
    await runInitMode(runtimeOptions);
  };
}
