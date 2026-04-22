/**
 * Connector for Indeed API.
 *
 * This mock implementation returns static job listings so the
 * application can be developed without external API access.
 */

import type { JobListing } from "@/types";
import type { ConnectorToken } from "@/app/talentforge/_types/connector";

/** Sample job listings returned by the mocked Indeed connector. */
const SAMPLE_LISTINGS: JobListing[] = [
  {
    title: "Software Engineer",
    company: "DataWorks",
    location: "Remote",
    url: "https://www.indeed.com/jobs/software-engineer-remote",
    source: "Indeed",
  },
  {
    title: "Data Analyst",
    company: "Analytics LLC",
    location: "Austin, TX",
    url: "https://www.indeed.com/jobs/data-analyst-austin",
    source: "Indeed",
  },
];

export class IndeedConnector {
  /**
   * Authenticate with Indeed.
   *
   * Returns a mock token so the connector can be used without real API
   * credentials.
   */
  async authenticate(): Promise<ConnectorToken> {
    // Return a mock token for the mocked connector
    return { accessToken: "mock-token" };
  }

  /**
   * Fetch job listings from Indeed.
   *
   * Returns a static array of sample listings.
   */
  async fetchData(token: ConnectorToken): Promise<JobListing[]> {
    void token; // token ignored in mock implementation
    return SAMPLE_LISTINGS;
  }

  async searchJobs(query: string): Promise<JobListing[]> {
    const trimmed = query.trim();

    if (!trimmed) {
      return SAMPLE_LISTINGS;
    }

    const lowerQuery = trimmed.toLowerCase();
    return SAMPLE_LISTINGS.filter((listing) => {
      const title = listing.title.toLowerCase();
      const company = listing.company.toLowerCase();
      const location = listing.location.toLowerCase();

      return (
        title.includes(lowerQuery) || company.includes(lowerQuery) || location.includes(lowerQuery)
      );
    });
  }

  /**
   * Send a message through Indeed.
   *
   * This mock simply resolves without performing any action.
   */
  async sendMessage(token: ConnectorToken, message: string): Promise<void> {
    void token; // token ignored in mock implementation
    void message; // silence unused parameter in mock implementation
  }
}

export default IndeedConnector;
