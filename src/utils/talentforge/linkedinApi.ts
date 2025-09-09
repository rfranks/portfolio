import { JobListing } from "@/types/talentforge/job";

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

export async function searchLinkedInJobs(
  query: string
): Promise<JobListing[]> {
  if (!query.trim()) return [];

  const url = `${LINKEDIN_API_URL}?q=${encodeURIComponent(query)}`;
  const headers: Record<string, string> = {};
  if (LINKEDIN_API_KEY) {
    headers["Authorization"] = `Bearer ${LINKEDIN_API_KEY}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return [];
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

    return jobsArray
      .filter((job): job is Record<string, unknown> =>
        typeof job === "object" && job !== null
      )
      .map((job) => normalizeLinkedInJob(job));
  } catch {
    return [];
  }
}
