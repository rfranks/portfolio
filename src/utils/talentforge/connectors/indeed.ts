/**
 * Connector for Indeed API.
 *
 * This mock implementation returns static job listings so the
 * application can be developed without external API access.
 */

import type { JobListing } from "@/types/talentforge/job";
import type { Connector } from "@/types/connector";

/** Sample job listings returned by the mocked Indeed connector. */
const SAMPLE_LISTINGS: JobListing[] = [
  {
    title: "Software Engineer",
    company: "Indeed",
    location: "Remote",
    url: "https://www.indeed.com/jobs/software-engineer-remote",
    source: "indeed",
  },
  {
    title: "Data Analyst",
    company: "Indeed",
    location: "Austin, TX",
    url: "https://www.indeed.com/jobs/data-analyst-austin",
    source: "indeed",
  },
];

export class IndeedConnector implements Connector {
  /**
   * Authenticate with Indeed.
   *
   * This mock implementation performs no action.
   */
  async authenticate(): Promise<void> {
    // No authentication needed for mocked connector
  }

  /**
   * Fetch job listings from Indeed.
   *
   * Returns a static array of sample listings.
   */
  async fetchData(): Promise<JobListing[]> {
    return SAMPLE_LISTINGS;
  }

  /**
   * Send a message through Indeed.
   *
   * This mock simply resolves without performing any action.
   */
  async sendMessage(message: string): Promise<void> {
    void message; // silence unused parameter in mock implementation
  }
}

export default IndeedConnector;
