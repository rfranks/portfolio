import { getAppCapabilityRegistry } from "@/components/portfolio/appCapabilityRegistry";

describe("app capability registry", () => {
  it("builds app capabilities from portfolioApps route contracts", () => {
    const appCapabilities = getAppCapabilityRegistry().filter((entry) => entry.kind === "app");
    const appByHref = new Map(appCapabilities.map((entry) => [entry.href, entry] as const));

    ["/health", "/replay", "/petly", "/zombiefish"].forEach((href) => {
      expect(appByHref.has(href)).toBeTruthy();
      const entry = appByHref.get(href);
      expect(entry?.features).toContain("launchable-app");
      expect(entry?.dataSources).toContain("resume-data.portfolioApps");
    });
  });

  it("marks non-drawer app routes as drawer-hidden", () => {
    const appCapabilities = getAppCapabilityRegistry().filter((entry) => entry.kind === "app");
    const appByHref = new Map(appCapabilities.map((entry) => [entry.href, entry] as const));

    expect(appByHref.get("/zombiefish")?.features).toContain("drawer-hidden");
    expect(appByHref.get("/health")?.features).toContain("drawer-hidden");
    expect(appByHref.get("/blackjack")?.features).toContain("drawer-visible");
  });
});
