import {
  buildHealthInspectionHref,
  buildReplayInspectionHref,
  buildRouteInspectionFlowSearch,
  normalizeRouteInspectionRoute,
  parseRouteInspectionFlowSearch,
} from "@/utils/observability/routeInspectionFlow";
import { SESSION_REPLAY_EVENT_KIND_ORDER } from "@/utils/observability/sessionReplayLite";

describe("routeInspectionFlow query contract", () => {
  it("normalizes route tokens", () => {
    expect(normalizeRouteInspectionRoute("/dna")).toBe("/dna");
    expect(normalizeRouteInspectionRoute("dna")).toBe("/dna");
    expect(normalizeRouteInspectionRoute("   ")).toBeNull();
    expect(normalizeRouteInspectionRoute(null)).toBeNull();
  });

  it("parses route/source/kinds from query string", () => {
    const parsed = parseRouteInspectionFlowSearch(
      "?route=%2Fdna&source=capability&kinds=route,navigation,media,invalid,route",
    );

    expect(parsed.route).toBe("/dna");
    expect(parsed.source).toBe("capability");
    expect(parsed.kinds).toEqual(["route", "navigation", "media"]);
  });

  it("returns empty kinds when not provided", () => {
    const parsed = parseRouteInspectionFlowSearch("?route=%2Freplay");

    expect(parsed.route).toBe("/replay");
    expect(parsed.source).toBeNull();
    expect(parsed.kinds).toEqual([]);
  });

  it("omits kinds when kinds match the default order", () => {
    const search = buildRouteInspectionFlowSearch({
      route: "/health",
      source: "health",
      kinds: SESSION_REPLAY_EVENT_KIND_ORDER,
    });

    expect(search).toBe("route=%2Fhealth&source=health");
  });

  it("builds health and replay inspection hrefs", () => {
    const healthHref = buildHealthInspectionHref({
      healthRoute: "/health",
      route: "/dna",
      source: "capability",
    });
    const replayHref = buildReplayInspectionHref({
      replayRoute: "/replay",
      route: "/dna",
      source: "health",
      kinds: ["route", "navigation"],
    });

    expect(healthHref).toBe("/health?route=%2Fdna&source=capability");
    expect(replayHref).toBe("/replay?route=%2Fdna&source=health&kinds=route%2Cnavigation");
  });
});
