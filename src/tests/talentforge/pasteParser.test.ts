describe("parsePastedHtml in SSR", () => {
  it("strips HTML tags when window is undefined", async () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    // Simulate server-side environment
    delete (globalThis as { window?: unknown }).window;

    await jest.isolateModulesAsync(async () => {
      const { parsePastedHtml } = await import("@/utils/talentforge/pasteParser");
      const result = parsePastedHtml("<p>Hello <strong>world</strong></p>");
      expect(result).toBe("Hello world");
      expect(result).not.toMatch(/<[^>]+>/);
    });

    (globalThis as { window?: unknown }).window = originalWindow;
  });
});
