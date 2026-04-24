import { createInitCommand } from "./init.mts";
import { createUpdateCommand } from "./update.mts";
import type { PortfolioSetupCommandContext, PortfolioSetupCommandHandler } from "./types.mts";

export function createPortfolioSetupCommandRegistry(params: {
  runInitMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>;
  runUpdateMode: (runtimeOptions: { dryRun: boolean; showDiff: boolean }) => Promise<void>;
}): Record<string, PortfolioSetupCommandHandler> {
  return {
    init: createInitCommand(params.runInitMode),
    update: createUpdateCommand(params.runUpdateMode),
  };
}

export async function runPortfolioSetupCommand(
  context: PortfolioSetupCommandContext,
  registry: Record<string, PortfolioSetupCommandHandler>,
): Promise<void> {
  const handler = registry[context.mode];
  if (!handler) {
    throw new Error(`Unsupported setup command: ${context.mode}`);
  }

  await handler(context);
}
