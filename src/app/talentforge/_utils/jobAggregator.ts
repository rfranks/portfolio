import type { JobListing } from "@/types";
import { LinkedInConnector } from "./connectors/linkedin";
import { IndeedConnector } from "./connectors/indeed";

/**
 * Fetch job listings from all supported connectors and combine the results.
 *
 * This utility currently aggregates listings from the mocked LinkedIn and
 * Indeed connectors used within TalentForge. Each connector returns listings in
 * the {@link JobListing} format, or data that contains such listings. The
 * aggregator normalizes these responses into a single array.
 */
export async function fetchAllListings(query: string = ""): Promise<JobListing[]> {
  const connectors = [
    { name: "LinkedIn", instance: new LinkedInConnector() },
    { name: "Indeed", instance: new IndeedConnector() },
  ] as const;

  const results = await Promise.allSettled(
    connectors.map(({ instance }) => instance.searchJobs(query)),
  );

  const listings: JobListing[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      listings.push(...result.value);
      return;
    }

    const { name } = connectors[index];
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(`[TalentForge] Failed to fetch listings from ${name}:`, result.reason);
    }
  });

  return listings;
}

const jobAggregator = {
  fetchAllListings,
};

export default jobAggregator;
