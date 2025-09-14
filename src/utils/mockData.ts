import type { ApplicationRecord, RolePosting, Offer, OfferComp, User } from "@/types";
import type { ResumeEntry } from "@/utils/talentforge/dataStore";
import type { ParsedResume } from "@/types/talentforge/resume";

const mockUserProfile: User = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane.doe@example.com",
};

const emptyParsed: ParsedResume = {
  contact: "",
  experience: [],
  education: [],
  skills: [],
};

export const mockResumes: ResumeEntry[] = [
  {
    id: "resume-1",
    userId: mockUserProfile.id,
    label: "Software Resume",
    title: "Software Resume",
    url: "https://example.com/jane-doe-software.pdf",
    content: "",
    parsed: { ...emptyParsed },
    tags: ["software", "typescript"],
  },
  {
    id: "resume-2",
    userId: mockUserProfile.id,
    label: "Product Resume",
     title: "Product Resume",
    url: "https://example.com/jane-doe-product.pdf",
    content: "",
    parsed: { ...emptyParsed },
    tags: ["product", "management"],
  },
];

const role1: RolePosting = {
  id: "role-1",
  title: "Frontend Developer",
  company: "Acme Corp",
  location: "Remote",
  url: "https://example.com/jobs/frontend",
  source: "linkedin",
};

const role2: RolePosting = {
  id: "role-2",
  title: "Backend Engineer",
  company: "Beta LLC",
  location: "New York, NY",
  url: "https://example.com/jobs/backend",
  source: "indeed",
};

export const mockApplications: ApplicationRecord[] = [
  {
    id: "app-1",
    applicant: mockUserProfile,
    role: role1,
    resumeVariant: mockResumes[0],
    status: "applied",
    history: [{ status: "applied", changedAt: new Date().toISOString() }],
  },
  {
    id: "app-2",
    applicant: mockUserProfile,
    role: role2,
    resumeVariant: mockResumes[1],
    status: "interview",
    history: [{ status: "interview", changedAt: new Date().toISOString() }],
  },
];

export const mockOffers: Offer[] = [
  {
    id: "offer-1",
    application: mockApplications[0],
    compensation: [{ type: "base", amount: 120000 } as OfferComp],
    summary: "Offer details for job application app-1",
  },
  {
    id: "offer-2",
    application: mockApplications[1],
    compensation: [{ type: "base", amount: 135000 } as OfferComp],
    summary: "Offer details for job application app-2",
  },
];

mockUserProfile.resumeVariants = mockResumes.map(
  ({ content, parsed, tags, ...rv }) => {
    void content;
    void parsed;
    void tags;
    return rv;
  },
);
mockUserProfile.applications = mockApplications;

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

