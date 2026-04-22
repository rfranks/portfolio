import type { PortfolioSetupCommandHandler } from "./types";

export function createUpdateCommand(
  runUpdateMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>,
): PortfolioSetupCommandHandler {
  return async ({ runtimeOptions }) => {
    await runUpdateMode(runtimeOptions);
  };
}
