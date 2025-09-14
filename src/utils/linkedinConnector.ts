/**
 * Utilities for interacting with the LinkedIn API.
 *
 * These functions are currently mocked for development purposes. They simulate
 * the shape of data returned by LinkedIn so that the rest of the application
 * can be developed without live API access.
 */

import { Connector, ConnectorToken } from "../types/connector";

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

export class LinkedInConnector implements Connector<LinkedInProfile> {
  /**
   * Authenticate with LinkedIn.
   *
   * This mock implementation performs no action.
   */
  async authenticate(): Promise<ConnectorToken> {
    // Mocked connector returns a static token
    return { accessToken: "mock-linkedin-token" };
  }

  /**
   * Retrieve the authenticated user's profile from LinkedIn.
   *
   * Here we return sample data for development.
   */
  async fetchData(token: ConnectorToken): Promise<LinkedInProfile> {
    void token; // silence unused parameter in mock implementation
    return {
      id: "123",
      firstName: "Ada",
      lastName: "Lovelace",
      headline: "Pioneer of Computing",
    };
  }

  /**
   * Send a message through LinkedIn.
   *
   * This mock simply resolves without performing any action.
   */
  async sendMessage(token: ConnectorToken, message: string): Promise<void> {
    void token; // silence unused parameters in mock implementation
    void message;
  }

  /**
   * Search LinkedIn jobs.
   *
   * This mock returns a static list of jobs.
   */
  async searchJobs(query: string): Promise<LinkedInJob[]> {
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
   */
  async fetchMessages(): Promise<LinkedInMessage[]> {
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
}
