import type { JobListing } from "@/types/talentforge/job";
import { LinkedInConnector, type LinkedInData } from "./connectors/linkedin";
import { IndeedConnector } from "./connectors/indeed";

/**
 * Fetch job listings from all supported connectors and combine the results.
 *
 * This utility currently aggregates listings from the mocked LinkedIn and
 * Indeed connectors used within TalentForge. Each connector returns listings in
 * the {@link JobListing} format, or data that contains such listings. The
 * aggregator normalises these responses into a single array.
 */
export async function fetchAllListings(): Promise<JobListing[]> {
  const linkedin = new LinkedInConnector();
  const indeed = new IndeedConnector();

  // Fetch data from both connectors in parallel.
  const [linkedinData, indeedListings] = await Promise.all<[
    LinkedInData,
    JobListing[],
  ]>([linkedin.fetchData(), indeed.fetchData()]);

  // LinkedIn returns an object with a `listings` property whereas Indeed
  // returns the listings array directly. Combine and return them.
  return [...linkedinData.listings, ...indeedListings];
}

export default {
  fetchAllListings,
};
