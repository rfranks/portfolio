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

export class LinkedInConnector {
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
          company: "Tech Corp",
          location: "Remote",
          url: "https://www.linkedin.com/jobs/123",
          source: "LinkedIn",
        },
        {
          title: "Product Manager",
          company: "Startup Hub",
          location: "San Francisco, CA",
          url: "https://www.linkedin.com/jobs/456",
          source: "LinkedIn",
        },
      ],
    };
  }

  async searchJobs(query: string): Promise<JobListing[]> {
    void query;
    const data = await this.fetchData();
    return data.listings;
  }

  async sendMessage(message: string): Promise<void> {
    void message; // mock does nothing
  }
}

export default LinkedInConnector;
