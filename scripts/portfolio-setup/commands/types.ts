import type { PortfolioSetupMode, PortfolioSetupRuntimeOptions } from "../../portfolio-setup-utils";

export type PortfolioSetupCommandContext = {
  mode: PortfolioSetupMode;
  runtimeOptions: PortfolioSetupRuntimeOptions;
};

export type PortfolioSetupCommandHandler = (context: PortfolioSetupCommandContext) => Promise<void>;
