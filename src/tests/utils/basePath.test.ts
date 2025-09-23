describe("withBasePath", () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    jest.resetModules();
  });

  const importWithBasePath = async () => {
    const mod = await import("@/utils/basePath");
    return mod.withBasePath;
  };

  it("prefixes the base path when the route only shares a prefix substring", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/foo";
    jest.resetModules();
    const withBasePath = await importWithBasePath();

    expect(withBasePath("/foobar")).toBe("/foo/foobar");
  });

  it("does not double prefix when the path already includes the base path", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/foo";
    jest.resetModules();
    const withBasePath = await importWithBasePath();

    expect(withBasePath("/foo/bar")).toBe("/foo/bar");
  });

  it("falls back to root paths when no base path is configured", async () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    jest.resetModules();
    const withBasePath = await importWithBasePath();

    expect(withBasePath("/foo")).toBe("/foo");
    expect(withBasePath("foo")).toBe("/foo");
  });
});
