import type { User, ResumeVariant } from "@/types";
import type { JobApplication } from "@/types/talentforge/job";
import type { ParsedResume } from "@/types/talentforge/resume";

export interface DemoResume extends ResumeVariant {
  content: string;
  parsed: ParsedResume;
  tags: string[];
}

export interface DemoData {
  user: User;
  resumes: DemoResume[];
  jobs: JobApplication[];
}

export function getDemoData(): DemoData {
  const userId = "demo-user";

  const user: User = {
    id: userId,
    name: "Jane Doe",
    email: "jane.doe@example.com",
  };

  const resumes: DemoResume[] = [
    {
      id: "resume-1",
      userId,
      label: "Software Engineer",
      url: "https://example.com/resume-1.pdf",
      notes: "General software engineering resume",
      content: "Jane Doe\nSoftware Engineer\n\nExperience: DemoCorp",
      parsed: {
        contact: "Jane Doe\njane.doe@example.com",
        experience: ["DemoCorp - Software Engineer"],
        education: ["State University - B.S. Computer Science"],
        skills: ["TypeScript", "React"],
      },
      tags: ["software", "typescript", "react"],
    },
    {
      id: "resume-2",
      userId,
      label: "Product Manager",
      url: "https://example.com/resume-2.pdf",
      notes: "Product management focused resume",
      content: "Jane Doe\nProduct Manager\n\nExperience: Products Inc.",
      parsed: {
        contact: "Jane Doe\njane.doe@example.com",
        experience: ["Products Inc. - PM"],
        education: ["Business School - MBA"],
        skills: ["Leadership", "Strategy"],
      },
      tags: ["product", "management"],
    },
  ];

  const jobs: JobApplication[] = [
    {
      id: "job-1",
      title: "Frontend Developer",
      company: "Acme Corp",
      location: "Remote",
      url: "https://example.com/jobs/frontend",
      source: "demo",
      status: "applied",
    },
    {
      id: "job-2",
      title: "Backend Engineer",
      company: "Beta LLC",
      location: "New York, NY",
      url: "https://example.com/jobs/backend",
      source: "demo",
      status: "interview",
    },
  ];

  return { user, resumes, jobs };
}

export default getDemoData;
