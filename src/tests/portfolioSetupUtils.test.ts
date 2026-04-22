import {
  buildSingleHunkDiffPreview,
  normalizeProjectEntry,
  parsePortfolioSetupArgs,
  validateProjectsOrThrow,
} from "../../scripts/portfolio-setup-utils";

describe("portfolio-setup-utils", () => {
  describe("parsePortfolioSetupArgs", () => {
    it("parses mode and runtime flags", () => {
      const parsed = parsePortfolioSetupArgs(["update", "--dry-run", "--no-diff"]);

      expect(parsed.mode).toBe("update");
      expect(parsed.usageError).toBeNull();
      expect(parsed.options).toEqual({
        dryRun: true,
        showDiff: false,
      });
    });

    it("returns usage error for unknown args", () => {
      const parsed = parsePortfolioSetupArgs(["init", "--wat"]);

      expect(parsed.mode).toBe("init");
      expect(parsed.usageError).toBe("Unknown argument: --wat");
    });
  });

  describe("normalizeProjectEntry", () => {
    it("normalizes project href/name", () => {
      const result = normalizeProjectEntry({
        name: "  Example App  ",
        href: "example-app",
        type: "personal",
      });

      expect(result).toEqual({
        name: "Example App",
        href: "/example-app",
        type: "personal",
      });
    });
  });

  describe("validateProjectsOrThrow", () => {
    it("throws on duplicate href values", () => {
      expect(() =>
        validateProjectsOrThrow([
          { name: "A", href: "/same" },
          { name: "B", href: "/same" },
        ]),
      ).toThrow("Duplicate project href detected: /same");
    });
  });

  describe("buildSingleHunkDiffPreview", () => {
    it("builds a readable diff preview for changed content", () => {
      const previous = '{\n  "title": "Old",\n  "count": 1\n}\n';
      const next = '{\n  "title": "New",\n  "count": 2\n}\n';

      const diff = buildSingleHunkDiffPreview(previous, next, "resumeData.json");

      expect(diff).toContain("--- resumeData.json");
      expect(diff).toContain("+++ resumeData.json (updated)");
      expect(diff).toContain('-  "title": "Old",');
      expect(diff).toContain('+  "title": "New",');
      expect(diff).toContain('-  "count": 1');
      expect(diff).toContain('+  "count": 2');
    });

    it("returns no-change message when content is unchanged", () => {
      const content = '{\n  "ok": true\n}\n';
      expect(buildSingleHunkDiffPreview(content, content, "resumeData.json")).toBe(
        "No changes for resumeData.json.",
      );
    });
  });
});
