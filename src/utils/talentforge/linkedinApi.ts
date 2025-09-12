import { JobListing } from "@/types/talentforge/job";
import { getStoredTokens } from "./oauth";

const LINKEDIN_API_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_API_URL ||
  "https://api.linkedin.com/v2/jobSearch";
const LINKEDIN_API_KEY = process.env.NEXT_PUBLIC_LINKEDIN_API_KEY;

const normalizeLinkedInJob = (job: Record<string, unknown>): JobListing => {
  const title =
    typeof job.title === "string"
      ? job.title
      : typeof job["position"] === "string"
      ? (job["position"] as string)
      : "";
  const company =
    typeof job.company === "string"
      ? job.company
      : typeof job["companyName"] === "string"
      ? (job["companyName"] as string)
      : typeof job["company_name"] === "string"
      ? (job["company_name"] as string)
      : "";
  const location =
    typeof job.location === "string"
      ? job.location
      : [job["city"], job["state"], job["country"]]
          .filter((v): v is string => typeof v === "string")
          .join(", ");
  const url =
    typeof job.url === "string"
      ? job.url
      : typeof job["jobUrl"] === "string"
      ? (job["jobUrl"] as string)
      : "";

  return {
    title,
    company,
    location,
    url,
    source: "linkedin",
  };
};

export interface LinkedInJobSearchResult {
  jobs: JobListing[];
  error?: string;
}

export async function searchLinkedInJobs(
  query: string
): Promise<LinkedInJobSearchResult> {
  if (!query.trim()) return { jobs: [] };

  const params = new URLSearchParams({ q: query });
  if (typeof window !== "undefined") {
    const rawSettings = window.localStorage.getItem("talentforge-settings");
    if (rawSettings) {
      try {
        const settings = JSON.parse(rawSettings) as {
          locations?: string;
          salaryMin?: string;
          salaryMax?: string;
        };
        if (settings.locations) {
          params.set("location", settings.locations);
        }
        if (settings.salaryMin) {
          params.set("salary_min", settings.salaryMin);
        }
        if (settings.salaryMax) {
          params.set("salary_max", settings.salaryMax);
        }
      } catch {
        // ignore malformed settings
      }
    }
  }

  const url = `${LINKEDIN_API_URL}?${params.toString()}`;
  const headers: Record<string, string> = {};
  const storedTokens =
    typeof window !== "undefined" ? getStoredTokens("linkedin") : null;
  if (storedTokens?.accessToken) {
    headers["Authorization"] = `Bearer ${storedTokens.accessToken}`;
  } else if (LINKEDIN_API_KEY) {
    headers["Authorization"] = `Bearer ${LINKEDIN_API_KEY}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "LinkedIn API error",
          response.status,
          response.statusText
        );
      }
      return {
        jobs: [],
        error: `LinkedIn API error: ${response.status} ${response.statusText}`,
      };
    }
    const data: unknown = await response.json();
    const dataObj = data as {
      elements?: unknown[];
      results?: unknown[];
    };
    const jobsArray: unknown[] = Array.isArray(dataObj.elements)
      ? dataObj.elements
      : Array.isArray(dataObj.results)
      ? dataObj.results
      : [];

    return {
      jobs: jobsArray
        .filter((job): job is Record<string, unknown> =>
          typeof job === "object" && job !== null
        )
        .map((job) => normalizeLinkedInJob(job)),
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch LinkedIn jobs", err);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      jobs: [],
      error: `Failed to fetch LinkedIn jobs: ${message}`,
    };
  }
}
