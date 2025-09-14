import { Connector } from "@/types/connector";
import type { JobListing } from "@/types/talentforge/job";

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
}

export interface LinkedInData {
  profile: LinkedInProfile;
  listings: JobListing[];
}

export class LinkedInConnector implements Connector {
  async authenticate(): Promise<void> {
    // Mocked connector does not require authentication
  }

  async fetchData(): Promise<LinkedInData> {
    return {
      profile: {
        id: "ln-123",
        firstName: "Ada",
        lastName: "Lovelace",
        headline: "Pioneer of Computing",
      },
      listings: [
        {
          title: "Software Engineer",
          company: "LinkedIn",
          location: "Remote",
          url: "https://www.linkedin.com/jobs/123",
          source: "linkedin",
        },
        {
          title: "Product Manager",
          company: "LinkedIn",
          location: "San Francisco, CA",
          url: "https://www.linkedin.com/jobs/456",
          source: "linkedin",
        },
      ],
    };
  }

  async sendMessage(message: string): Promise<void> {
    void message; // mock does nothing
  }
}

export default LinkedInConnector;
