"use client";

import type { User, ResumeVariant, RolePosting, ApplicationRecord, ResumeEntry } from "@/types";
import dataStore from "./dataStore";

const DEMO_DATA_FLAG = "tf_demo_data_inserted";

/**
 * Generate a small set of demo data for TalentForge.
 */
export function getDemoData(): {
  user: User;
  resumes: ResumeEntry[];
  jobApplications: ApplicationRecord[];
} {
  const user: User = {
    id: "demo-user-1",
    name: "Jane Doe",
    email: "jane.doe@example.com",
  };

  const resume: ResumeEntry = {
    id: "demo-resume-1",
    userId: user.id,
    label: "General Resume",
    title: "General Resume",
    url: "https://example.com/resume.pdf",
    notes: "Demo resume for testing",
    content: "Jane Doe\nSoftware Engineer",
    parsed: {
      contact: "Jane Doe\nSan Francisco, CA\njane.doe@example.com",
      experience: ["Acme Corp - Software Engineer"],
      education: ["B.S. Computer Science"],
      skills: ["TypeScript", "React"],
    },
    tags: ["typescript", "react"],
    sourceFilename: "demo-resume.pdf",
    importedAt: "2024-01-01T00:00:00.000Z",
  };

  const role: RolePosting = {
    id: "demo-role-1",
    title: "Frontend Developer",
    company: "Acme Corp",
    location: "Remote",
    url: "https://example.com/jobs/frontend-developer",
    source: "demo",
  };

  const application: ApplicationRecord = {
    id: "demo-app-1",
    applicant: user,
    role,
    resumeVariant: resume as ResumeVariant,
    status: "applied",
    history: [{ status: "applied", changedAt: new Date().toISOString() }],
    activities: [],
    recruiters: [],
    threads: [],
  };

  return { user, resumes: [resume], jobApplications: [application] };
}

/**
 * Populate the data store with demo data.
 */
export function loadDemoData(): void {
  const { user, resumes, jobApplications } = getDemoData();
  dataStore.saveUserProfile(user);
  dataStore.saveResumes(resumes);
  jobApplications.forEach((app) => dataStore.addJobApplication(app));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_DATA_FLAG, "true");
  }
}

/**
 * Clear demo data from localStorage.
 * Removes demo user profile, resumes, job applications, offers, and the tf_demo_data_inserted flag.
 */
export function clearDemoData(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("userProfile");
    window.localStorage.removeItem("resumes");
    window.localStorage.removeItem("jobApplications");
    window.localStorage.removeItem("offers");
    window.localStorage.removeItem(DEMO_DATA_FLAG);
  }
}

export default getDemoData;
