import type { PortfolioSetupCommandHandler } from "./types.mts";

export function createUpdateCommand(
  runUpdateMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>,
): PortfolioSetupCommandHandler {
  return async ({ runtimeOptions }) => {
    await runUpdateMode(runtimeOptions);
  };
}
