import {
  UserProfile,
  Resume,
  Offer,
  JobApplication,
} from "@/types/talentforge";

// Sample resumes for demonstration purposes
export const mockResumes: Resume[] = [
  {
    id: "resume-1",
    filename: "jane-doe-software.pdf",
    url: "https://example.com/jane-doe-software.pdf",
    tags: ["software", "typescript"],
  },
  {
    id: "resume-2",
    filename: "jane-doe-product.pdf",
    url: "https://example.com/jane-doe-product.pdf",
    tags: ["product", "management"],
  },
];

// Sample job offers for demonstration purposes
export const mockOffers: Offer[] = [
  {
    id: "offer-1",
    applicationId: "app-1",
    compensation: "$120,000",
    accepted: false,
  },
  {
    id: "offer-2",
    applicationId: "app-2",
    compensation: "$135,000 + stock",
    accepted: true,
  },
];

// Sample job applications for demonstration purposes
export const mockApplications: JobApplication[] = [
  {
    id: "app-1",
    title: "Frontend Developer",
    company: "Acme Corp",
    location: "Remote",
    url: "https://example.com/jobs/frontend",
    source: "linkedin",
    status: "applied",
  },
  {
    id: "app-2",
    title: "Backend Engineer",
    company: "Beta LLC",
    location: "New York, NY",
    url: "https://example.com/jobs/backend",
    source: "indeed",
    status: "interview",
  },
];

// Sample user profile that references the above resumes
export const mockUserProfile: UserProfile = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  resumes: mockResumes,
};

const DEMO_DATA_KEY = "tf_demo_data_inserted";

/**
 * Insert mock data into localStorage on first run for demonstration purposes.
 */
export function insertMockData(): void {
  if (typeof window === "undefined") return;

  if (localStorage.getItem(DEMO_DATA_KEY)) {
    return;
  }

  try {
    localStorage.setItem("userProfile", JSON.stringify(mockUserProfile));
    localStorage.setItem("resumes", JSON.stringify(mockResumes));
    localStorage.setItem("offers", JSON.stringify(mockOffers));
    localStorage.setItem("jobApplications", JSON.stringify(mockApplications));
    localStorage.setItem(DEMO_DATA_KEY, "true");
  } catch {
    // Ignore write errors (e.g., storage is unavailable)
  }
}

export default insertMockData;
