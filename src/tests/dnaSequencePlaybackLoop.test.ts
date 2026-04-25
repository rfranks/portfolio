import {
  resolvePlaybackSeedMaxBasePair,
  resolvePlaybackTickMaxBasePair,
} from "@/app/dna/_hooks/useSequencePlaybackLoop";

describe("useSequencePlaybackLoop math helpers", () => {
  it("seeds from step size when the current range is exhausted", () => {
    expect(resolvePlaybackSeedMaxBasePair(120, [1, 120], 10)).toBe(10);
  });

  it("seeds from current range when playback has not reached the end", () => {
    expect(resolvePlaybackSeedMaxBasePair(120, [1, 40], 10)).toBe(40);
  });

  it("uses a clamped minimum seed for empty ranges", () => {
    expect(resolvePlaybackSeedMaxBasePair(120, null, 10)).toBe(10);
    expect(resolvePlaybackSeedMaxBasePair(5, null, 10)).toBe(5);
  });

  it("advances and clamps each playback tick", () => {
    expect(resolvePlaybackTickMaxBasePair(40, 120, 10)).toBe(50);
    expect(resolvePlaybackTickMaxBasePair(118, 120, 10)).toBe(120);
  });
});
