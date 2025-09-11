import { JobListing } from "@/types/talentforge/job";

export interface IndeedSearchFilters {
  roles?: string[];
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
}

const INDEED_API_URL =
  process.env.NEXT_PUBLIC_INDEED_API_URL ||
  "https://api.indeed.com/v2/jobs";
const INDEED_API_KEY = process.env.NEXT_PUBLIC_INDEED_API_KEY;

const normalizeIndeedJob = (job: Record<string, unknown>): JobListing => {
  const title =
    typeof job.title === "string"
      ? job.title
      : typeof job.job_title === "string"
      ? job.job_title
      : "";
  const company =
    typeof job.company === "string"
      ? job.company
      : typeof job.company_name === "string"
      ? job.company_name
      : "";
  const location =
    typeof job.location === "string"
      ? job.location
      : [job.city, job.state, job.country]
          .filter((v): v is string => typeof v === "string")
          .join(", ");
  const url =
    typeof job.url === "string"
      ? job.url
      : typeof job.job_url === "string"
      ? job.job_url
      : "";

  return {
    title,
    company,
    location,
    url,
    source: "indeed",
  };
};

export async function searchIndeedJobs(
  query: string,
  filters: IndeedSearchFilters = {}
): Promise<JobListing[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams();
  params.set("q", query);
  if (filters.roles && filters.roles.length > 0) {
    params.set("roles", filters.roles.join(","));
  }
  if (filters.locations && filters.locations.length > 0) {
    params.set("locations", filters.locations.join(","));
  }
  if (typeof filters.salaryMin === "number") {
    params.set("salary_min", String(filters.salaryMin));
  }
  if (typeof filters.salaryMax === "number") {
    params.set("salary_max", String(filters.salaryMax));
  }

  const url = `${INDEED_API_URL}?${params.toString()}`;
  const headers: Record<string, string> = {};
  if (INDEED_API_KEY) {
    headers["X-API-KEY"] = INDEED_API_KEY;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return [];
    }
    const data: unknown = await response.json();
    const dataObj = data as {
      results?: unknown[];
      jobs?: unknown[];
    };
    const jobsArray: unknown[] = Array.isArray(dataObj.results)
      ? dataObj.results
      : Array.isArray(dataObj.jobs)
      ? dataObj.jobs
      : [];

    return jobsArray
      .filter((job): job is Record<string, unknown> =>
        typeof job === "object" && job !== null
      )
      .map((job) => normalizeIndeedJob(job));
  } catch {
    return [];
  }
}
