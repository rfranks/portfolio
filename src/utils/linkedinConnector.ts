/**
 * Utilities for interacting with the LinkedIn API.
 *
 * These functions are currently mocked for development purposes. They simulate
 * the shape of data returned by LinkedIn so that the rest of the application
 * can be developed without live API access.
 */

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
}

export interface LinkedInJob {
  id: string;
  title: string;
  company: string;
  location: string;
}

export interface LinkedInMessage {
  id: string;
  from: string;
  body: string;
}

/**
 * Retrieve the authenticated user's profile from LinkedIn.
 *
 * In a real implementation this would make an authenticated HTTP request to
 * `https://api.linkedin.com/v2/me` using an OAuth access token:
 *
 * ```ts
 * const response = await fetch("https://api.linkedin.com/v2/me", {
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 * const data = (await response.json()) as LinkedInProfile;
 * return data;
 * ```
 *
 * Here we return sample data for development.
 */
export async function fetchProfile(): Promise<LinkedInProfile> {
  return {
    id: "123",
    firstName: "Ada",
    lastName: "Lovelace",
    headline: "Pioneer of Computing",
  };
}

/**
 * Search LinkedIn jobs.
 *
 * A production version would query LinkedIn's job search endpoint, for example:
 *
 * ```ts
 * const response = await fetch(
 *   `https://api.linkedin.com/v2/jobSearch?q=${encodeURIComponent(query)}`,
 *   { headers: { Authorization: `Bearer ${token}` } }
 * );
 * const jobs = (await response.json()) as LinkedInJob[];
 * return jobs;
 * ```
 *
 * This mock returns a static list of jobs.
 */
export async function searchJobs(query: string): Promise<LinkedInJob[]> {
  void query; // silence unused parameter in mock implementation
  return [
    {
      id: "1",
      title: "Software Engineer",
      company: "LinkedIn",
      location: "Remote",
    },
    {
      id: "2",
      title: "Product Manager",
      company: "LinkedIn",
      location: "San Francisco, CA",
    },
  ];
}

/**
 * Fetch recent LinkedIn messages.
 *
 * In production this would call something like
 * `https://api.linkedin.com/v2/messages` with the appropriate authorization
 * header and return the parsed JSON response.
 */
export async function fetchMessages(): Promise<LinkedInMessage[]> {
  return [
    {
      id: "m1",
      from: "Recruiter",
      body: "We came across your profile and would love to chat.",
    },
    {
      id: "m2",
      from: "Colleague",
      body: "Great work on the recent project!",
    },
  ];
}

