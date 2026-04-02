import type { JobListing } from "@/types";

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
    const data = await this.fetchData();
    const trimmed = query.trim();

    if (!trimmed) {
      return data.listings;
    }

    const lowerQuery = trimmed.toLowerCase();
    return data.listings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(lowerQuery) ||
        listing.company.toLowerCase().includes(lowerQuery),
    );
  }

  async sendMessage(message: string): Promise<void> {
    void message; // mock does nothing
  }
}

export default LinkedInConnector;
