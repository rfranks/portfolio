import type { JobListing } from "@/types/talentforge/job";
import { LinkedInConnector } from "./connectors/linkedin";
import { IndeedConnector } from "./connectors/indeed";

/**
 * Fetch job listings from all supported connectors and combine the results.
 *
 * This utility currently aggregates listings from the mocked LinkedIn and
 * Indeed connectors used within TalentForge. Each connector returns listings in
 * the {@link JobListing} format, or data that contains such listings. The
 * aggregator normalises these responses into a single array.
 */
export async function fetchAllListings(query: string = ""): Promise<JobListing[]> {
  const linkedin = new LinkedInConnector();
  const indeed = new IndeedConnector();

  // Fetch job listings from both connectors in parallel using a job search query.
  const [linkedinListings, indeedListings] = await Promise.all([
    linkedin.searchJobs(query),
    indeed.searchJobs(query),
  ]);

  // Both connectors return arrays of listings; combine and return them.
  return [...linkedinListings, ...indeedListings];
}

const jobAggregator = {
  fetchAllListings,
};

export default jobAggregator;
