/**
 * Utilities for interacting with the Indeed API.
 *
 * The functions below are mocked to return sample data so that the application
 * can be developed without access to the real Indeed services.
 */

import { Connector, ConnectorToken } from "../_types/connector";

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

export class IndeedConnector implements Connector<IndeedProfile> {
  /**
   * Authenticate with Indeed.
   *
   * This mock implementation performs no action.
   */
  async authenticate(): Promise<ConnectorToken> {
    // Mocked connector returns a static token
    return { accessToken: "mock-indeed-token" };
  }

  /**
   * Retrieve the user's profile from Indeed.
   */
  async fetchData(token: ConnectorToken): Promise<IndeedProfile> {
    void token; // silence unused parameter in mock implementation
    return {
      id: "abc",
      name: "Grace Hopper",
      resumeTitle: "Computer Scientist",
    };
  }

  /**
   * Send a message through Indeed.
   *
   * This mock simply resolves without performing any action.
   */
  async sendMessage(token: ConnectorToken, message: string): Promise<void> {
    void token; // silence unused parameters in mock implementation
    void message;
  }

  /**
   * Search for jobs on Indeed.
   */
  async searchJobs(query: string): Promise<IndeedJob[]> {
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
   */
  async fetchMessages(): Promise<IndeedMessage[]> {
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
}
