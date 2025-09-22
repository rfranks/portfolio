import {
  filterApplications,
  hasActiveFilters,
  type ApplicationFilters,
} from "@/utils/talentforge/applicationFilters";
import type { JobApplication, RecruiterEntry, ResumeEntry } from "@/types";

type PartialApplication = Partial<JobApplication> & {
  role?: Partial<JobApplication["role"]>;
};

const defaultApplicant: JobApplication["applicant"] = {
  id: "user-1",
  name: "Candidate One",
  email: "candidate@example.com",
};

const resumeGeneral: ResumeEntry = {
  id: "resume-1",
  userId: "user-1",
  label: "General Resume",
  title: "General Engineering Resume",
  url: "https://example.com/resume-1.pdf",
  content: "Experience in backend systems",
  parsed: {
    contact: "Candidate One",
    experience: [],
    education: [],
    skills: [],
  },
  tags: ["engineering"],
  notes: "Tailored for backend roles",
};

const resumeDesign: ResumeEntry = {
  id: "resume-2",
  userId: "user-1",
  label: "Design Resume",
  title: "Product Design Resume",
  url: "https://example.com/resume-2.pdf",
  content: "Experience in product design",
  parsed: {
    contact: "Candidate One",
    experience: [],
    education: [],
    skills: [],
  },
  tags: ["design"],
  notes: "Highlights design projects",
};

const recruiterAlice: RecruiterEntry = {
  id: "rec-1",
  name: "Alice Recruiter",
  email: "alice@example.com",
  connector: "LinkedIn",
  tags: ["design"],
  notes: "Responsive",
  threadIds: [],
};

const recruiterBob: RecruiterEntry = {
  id: "rec-2",
  name: "Bob Talent",
  email: "bob@example.com",
  connector: "Indeed",
  tags: ["engineering"],
  notes: "Prefers email",
  threadIds: [],
};

function buildApplication(
  id: string,
  overrides: PartialApplication = {},
): JobApplication {
  const {
    role: roleOverride,
    history: historyOverride,
    status: statusOverride,
    applicant: applicantOverride,
    ...rest
  } = overrides;

  const status: JobApplication["status"] = statusOverride ?? "applied";

  const role: JobApplication["role"] = {
    id: `role-${id}`,
    title: "Software Engineer",
    company: "Acme Corp",
    location: "Remote",
    description: "Work on modern web applications",
    url: "https://example.com/job",
    source: "LinkedIn",
    ...(roleOverride ?? {}),
  } as JobApplication["role"];

  const applicant = applicantOverride ?? defaultApplicant;

  const history =
    historyOverride ?? [{ status, changedAt: "2024-01-01T00:00:00Z" }];

  const base: JobApplication = {
    id,
    applicant,
    role,
    status,
    history,
  };

  return { ...base, ...rest } as JobApplication;
}

const applications: JobApplication[] = [
  buildApplication("app-1", {
    status: "interview",
    role: {
      id: "role-1",
      title: "Product Designer",
      company: "Globex",
      location: "Remote",
      description: "Design delightful product experiences",
    },
    resumeVariant: resumeDesign,
    recruiters: [recruiterAlice],
  }),
  buildApplication("app-2", {
    status: "applied",
    role: {
      id: "role-2",
      title: "Backend Engineer",
      company: "Initech",
      description: "Build reliable APIs",
    },
    resumeVariant: resumeGeneral,
    recruiters: [recruiterBob],
  }),
  buildApplication("app-3", {
    status: "offer",
    role: {
      id: "role-3",
      title: "Data Scientist",
      company: "Globex",
      location: "New York",
      description: "Analyze product usage data",
    },
    resumeVariant: resumeDesign,
    recruiters: [recruiterAlice, recruiterBob],
  }),
];

const baseFilters: ApplicationFilters = {
  searchText: "",
  status: "all",
  company: "",
  recruiterId: "",
  resumeId: "",
};

describe("filterApplications", () => {
  test("returns every application when no filters are active", () => {
    const result = filterApplications(applications, baseFilters);
    expect(result).toEqual(applications);
  });

  test("matches applications by search text across multiple fields", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      searchText: "backend",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(1);
    expect(result[0].role.title).toBe("Backend Engineer");
  });

  test("search is case-insensitive and matches recruiter names", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      searchText: "ALICE",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(2);
    expect(result.every((app) => app.recruiters?.some((r) => r.id === "rec-1"))).toBe(
      true,
    );
  });

  test("filters applications by status", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      status: "offer",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("offer");
  });

  test("filters applications by company", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      company: "Globex",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(2);
    expect(result.every((app) => app.role.company === "Globex")).toBe(true);
  });

  test("filters applications by recruiter", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      recruiterId: "rec-2",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(2);
    expect(result.every((app) => app.recruiters?.some((r) => r.id === "rec-2"))).toBe(
      true,
    );
  });

  test("filters applications by resume variant", () => {
    const filters: ApplicationFilters = {
      ...baseFilters,
      resumeId: "resume-1",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(1);
    expect(result[0].resumeVariant?.id).toBe("resume-1");
  });

  test("applies all active filters together", () => {
    const filters: ApplicationFilters = {
      searchText: "designer",
      status: "interview",
      company: "Globex",
      recruiterId: "rec-1",
      resumeId: "resume-2",
    };
    const result = filterApplications(applications, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("app-1");
  });
});

describe("hasActiveFilters", () => {
  test("returns false when every filter is unset", () => {
    expect(hasActiveFilters(baseFilters)).toBe(false);
  });

  test("returns true when any filter is applied", () => {
    expect(
      hasActiveFilters({
        ...baseFilters,
        searchText: "Acme",
      }),
    ).toBe(true);
    expect(
      hasActiveFilters({
        ...baseFilters,
        status: "offer",
      }),
    ).toBe(true);
    expect(
      hasActiveFilters({
        ...baseFilters,
        company: "Globex",
      }),
    ).toBe(true);
    expect(
      hasActiveFilters({
        ...baseFilters,
        recruiterId: "rec-1",
      }),
    ).toBe(true);
    expect(
      hasActiveFilters({
        ...baseFilters,
        resumeId: "resume-2",
      }),
    ).toBe(true);
  });
});
