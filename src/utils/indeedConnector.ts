/**
 * Utilities for interacting with the Indeed API.
 *
 * The functions below are mocked to return sample data so that the application
 * can be developed without access to the real Indeed services.
 */

import { Connector } from "../types/connector";

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
   * Retrieve the user's profile from Indeed.
   */
  async fetchData(): Promise<IndeedProfile> {
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
  async sendMessage(message: string): Promise<void> {
    void message; // silence unused parameter in mock implementation
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
