import { searchIndeedJobs, IndeedSearchFilters } from "./indeedApi";
import { searchLinkedInJobs } from "./linkedinApi";
import type { JobListing } from "@/types/talentforge/job";

export interface AggregatedJobSearchResult {
  jobs: JobListing[];
  errors: string[];
}

const dedupeJobs = (jobs: JobListing[]): JobListing[] => {
  const map = new Map<string, JobListing>();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}::${job.company.toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, job);
    }
  }
  return Array.from(map.values());
};

const relevanceScore = (job: JobListing, query: string): number => {
  const q = query.toLowerCase();
  const title = job.title.toLowerCase();
  const company = job.company.toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 2;
  if (company.includes(q)) score += 1;
  return score;
};

export async function aggregateJobSearch(
  query: string,
  filters: IndeedSearchFilters = {},
): Promise<AggregatedJobSearchResult> {
  if (!query.trim()) return { jobs: [], errors: [] };

  const [indeedJobs, linkedinResult] = await Promise.all([
    searchIndeedJobs(query, filters),
    searchLinkedInJobs(query),
  ]);

  const errors: string[] = [];
  if (linkedinResult.error) {
    errors.push(linkedinResult.error);
  }

  const combined = [...indeedJobs, ...linkedinResult.jobs];
  const deduped = dedupeJobs(combined);
  const sorted = deduped.sort(
    (a, b) => relevanceScore(b, query) - relevanceScore(a, query),
  );

  return { jobs: sorted, errors };
}

