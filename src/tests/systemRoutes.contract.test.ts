import HealthPage, { metadata as healthMetadata } from "@/app/health/page";
import SessionReplayPage, { metadata as replayMetadata } from "@/app/replay/page";

describe("system route contracts", () => {
  it("health route exports stable metadata contract", () => {
    expect(healthMetadata.title).toBe("Portfolio Health Dashboard");
    expect(typeof healthMetadata.description).toBe("string");
    expect((healthMetadata.description as string).length).toBeGreaterThan(20);
  });

  it("replay route exports stable metadata contract", () => {
    expect(replayMetadata.title).toBe("Session Replay Lite Viewer");
    expect(typeof replayMetadata.description).toBe("string");
    expect((replayMetadata.description as string).length).toBeGreaterThan(20);
  });

  it("health and replay routes render client shells", () => {
    expect(typeof HealthPage).toBe("function");
    expect(typeof SessionReplayPage).toBe("function");
  });
});
