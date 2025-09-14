/**
 * Utilities for interacting with the Indeed API.
 *
 * The functions below are mocked to return sample data so that the application
 * can be developed without access to the real Indeed services.
 */

export interface IndeedProfile {
  id: string;
  name: string;
  resumeTitle: string;
}

export interface IndeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
}

export interface IndeedMessage {
  id: string;
  from: string;
  body: string;
}

/**
 * Retrieve the user's profile from Indeed.
 *
 * A production implementation would call an endpoint such as
 * `https://api.indeed.com/v1/profile` with an API key:
 *
 * ```ts
 * const response = await fetch("https://api.indeed.com/v1/profile", {
 *   headers: { Authorization: `Bearer ${apiKey}` },
 * });
 * const data = (await response.json()) as IndeedProfile;
 * return data;
 * ```
 */
export async function fetchProfile(): Promise<IndeedProfile> {
  return {
    id: "abc",
    name: "Grace Hopper",
    resumeTitle: "Computer Scientist",
  };
}

/**
 * Search for jobs on Indeed.
 *
 * In reality this would send a request like
 * `https://api.indeed.com/v2/jobs?q=${encodeURIComponent(query)}` and parse the
 * JSON response.
 */
export async function searchJobs(query: string): Promise<IndeedJob[]> {
  void query;
  return [
    {
      id: "j1",
      title: "Frontend Developer",
      company: "Indeed",
      location: "Austin, TX",
    },
    {
      id: "j2",
      title: "Data Analyst",
      company: "Indeed",
      location: "New York, NY",
    },
  ];
}

/**
 * Fetch recent messages from the Indeed messaging platform.
 *
 * A real implementation would call an endpoint like
 * `https://api.indeed.com/v1/messages` with the appropriate credentials and
 * return the parsed JSON.
 */
export async function fetchMessages(): Promise<IndeedMessage[]> {
  return [
    {
      id: "m1",
      from: "Recruiter",
      body: "Your application looks promising. Let's talk!",
    },
    {
      id: "m2",
      from: "Indeed Support",
      body: "Your job alert has been created.",
    },
  ];
}

