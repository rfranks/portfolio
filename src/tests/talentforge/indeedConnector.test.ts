import { IndeedConnector } from "@/utils/talentforge/connectors/indeed";

describe("IndeedConnector.searchJobs", () => {
  it("returns all listings when no query is provided", async () => {
    const connector = new IndeedConnector();

    const results = await connector.searchJobs("   ");

    expect(results).toHaveLength(2);
    expect(results.map((job) => job.source)).toEqual([
      "Indeed",
      "Indeed",
    ]);
  });

  it("performs a case-insensitive match on title, company, and location", async () => {
    const connector = new IndeedConnector();

    await expect(connector.searchJobs("software")).resolves.toEqual([
      expect.objectContaining({ title: "Software Engineer" }),
    ]);

    await expect(connector.searchJobs("analytics llc")).resolves.toEqual([
      expect.objectContaining({ company: "Analytics LLC" }),
    ]);

    await expect(connector.searchJobs("remote")).resolves.toEqual([
      expect.objectContaining({ location: "Remote" }),
    ]);
  });

  it("returns an empty array when no listings match the query", async () => {
    const connector = new IndeedConnector();

    await expect(connector.searchJobs("nonexistent role")).resolves.toEqual([]);
  });
});

