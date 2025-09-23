import {
  importFromJson,
  MESSAGES_VERSION,
  OFFERS_VERSION,
  APPLICATIONS_VERSION,
  RESUMES_VERSION,
  GOALS_VERSION,
  getCurrentCompensation,
  saveCurrentCompensation,
  getGoals,
  setGoals,
  CONNECTOR_SYNC_SNAPSHOT_VERSION,
  LINKEDIN_PROFILE_SNAPSHOT_VERSION,
  getConnectorSyncSnapshot,
  saveConnectorSyncSnapshot,
  getLinkedInProfileSnapshot,
  saveLinkedInProfileSnapshot,
  bulkUpdateJobApplicationStatus,
  bulkUpdateJobApplications,
  getJobApplications,
} from "../../utils/talentforge/dataStore";
import { loadItem, saveItem } from "../../utils/storage";
import type {
  ResumeEntry,
  ConnectorSyncSnapshot,
  LinkedInProfileSnapshot,
  JobApplication,
} from "../../types";

interface Message {
  replies: { body: string }[];
}

interface Offer {
  compensation: { notes: string }[];
}

interface StoredJobApplication {
  role: { title: string };
}

const baseApplicant: JobApplication["applicant"] = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
};

const baseRole: JobApplication["role"] = {
  id: "role-base",
  title: "Sample Role",
  company: "Acme Corp",
  location: "Remote",
  description: "Sample description",
};

function createApplication(
  id: string,
  overrides: Partial<JobApplication> = {},
): JobApplication {
  const status = overrides.status ?? "applied";
  const history =
    overrides.history ?? [{ status, changedAt: "2024-01-01T00:00:00.000Z" }];
  return {
    id,
    applicant: overrides.applicant ?? baseApplicant,
    role: { ...baseRole, id: `role-${id}`, ...(overrides.role ?? {}) },
    status,
    history,
    ...overrides,
  };
}

function createResume(
  id: string,
  overrides: Partial<ResumeEntry> = {},
): ResumeEntry {
  return {
    id,
    userId: overrides.userId ?? "user-1",
    label: overrides.label ?? "Resume",
    title: overrides.title ?? "Resume",
    url: overrides.url ?? "",
    content: overrides.content ?? "",
    parsed:
      overrides.parsed ?? {
        contact: "",
        experience: [],
        education: [],
        skills: [],
      },
    tags: overrides.tags ?? [],
    importedAt: overrides.importedAt ?? "2024-01-01T00:00:00.000Z",
    ...overrides,
  } as ResumeEntry;
}

describe("dataStore migrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("importFromJson migrates legacy snapshot", () => {
    const legacySnapshot = {
      version: 1,
      data: {
        messages: [
          {
            id: "m1",
            connector: "email",
            content: "hello",
            status: "unread",
            replies: [
              { id: "r1", content: "thanks", sentAt: "2023-01-01T00:00:00.000Z" },
            ],
          },
        ],
        offers: [
          { id: "o1", compensation: "100k", result: "pending" },
        ],
        jobApplications: [
          {
            id: "a1",
            title: "Engineer",
            company: "Acme",
            location: "Remote",
            url: "http://example.com",
            source: "indeed",
            status: "applied",
            history: [],
          },
        ],
        "talentforge-goal-selections": {
          version: 1,
          data: ["resume", "networking", "resume"],
        },
      },
    };

    importFromJson(JSON.stringify(legacySnapshot));

    const messages = loadItem<Message[]>("messages", MESSAGES_VERSION)!;
    expect(messages).toHaveLength(1);
    expect(messages[0].replies[0].body).toBe("thanks");

    const offers = loadItem<Offer[]>("offers", OFFERS_VERSION)!;
    expect(offers).toHaveLength(1);
    expect(offers[0].compensation[0].notes).toBe("100k");

    const apps = loadItem<StoredJobApplication[]>(
      "jobApplications",
      APPLICATIONS_VERSION,
    )!;
    expect(apps).toHaveLength(1);
    expect(apps[0].role.title).toBe("Engineer");

    const goals = loadItem<string[]>("talentforge-goals", GOALS_VERSION)!;
    expect(goals).toEqual(["resume", "networking"]);
    expect(getGoals()).toEqual(["resume", "networking"]);
  });

  test("importFromJson populates connector snapshot defaults", () => {
    const snapshot = {
      version: 5,
      data: {},
    };

    importFromJson(JSON.stringify(snapshot));

    const connectorSync = loadItem<ConnectorSyncSnapshot>(
      "connectorSyncSnapshot",
      CONNECTOR_SYNC_SNAPSHOT_VERSION,
    )!;
    expect(connectorSync).toEqual({});

    const linkedinProfile = loadItem<LinkedInProfileSnapshot>(
      "linkedinProfileSnapshot",
      LINKEDIN_PROFILE_SNAPSHOT_VERSION,
    )!;
    expect(linkedinProfile).toEqual({ listings: [] });

    expect(getConnectorSyncSnapshot()).toEqual({});
    expect(getLinkedInProfileSnapshot()).toEqual({ listings: [] });
  });

  test("importFromJson adds resume metadata when migrating snapshots", () => {
    jest.useFakeTimers();
    try {
      const fixedDate = new Date("2024-03-01T12:00:00.000Z");
      jest.setSystemTime(fixedDate);

      const snapshot = {
        version: 3,
        data: {
          resumes: {
            version: 1,
            data: [
              {
                id: "r1",
                userId: "",
                label: "",
                title: "Legacy Resume",
                url: "",
                content: "",
                tags: [],
                parsed: { contact: "", experience: [], education: [], skills: [] },
              },
            ],
          },
        },
      };

      importFromJson(JSON.stringify(snapshot));

      const resumes = loadItem<ResumeEntry[]>("resumes", RESUMES_VERSION)!;
      expect(resumes).toHaveLength(1);
      expect(resumes[0].importedAt).toBe(fixedDate.toISOString());
      expect(resumes[0].sourceFilename).toBe("Imported resume");
    } finally {
      jest.useRealTimers();
    }
  });

  test("getJobApplications normalizes reminder fields", () => {
    const legacyApps: JobApplication[] = [
      {
        ...createApplication("legacy-1"),
        nextAction: "  Call recruiter  ",
        dueAt: " 2024-04-12T09:00:00Z ",
      },
      {
        ...createApplication("legacy-2"),
        nextAction: "",
        dueAt: "invalid-date",
      },
    ];

    saveItem("jobApplications", legacyApps, APPLICATIONS_VERSION - 1);

    const applications = getJobApplications();
    expect(applications).toHaveLength(2);
    expect(applications[0].nextAction).toBe("Call recruiter");
    expect(applications[0].dueAt).toBe("2024-04-12T09:00:00.000Z");
    expect(applications[1].nextAction).toBeUndefined();
    expect(applications[1].dueAt).toBeUndefined();

    const stored = loadItem<JobApplication[]>(
      "jobApplications",
      APPLICATIONS_VERSION,
    )!;
    expect(stored[0].nextAction).toBe("Call recruiter");
    expect(stored[0].dueAt).toBe("2024-04-12T09:00:00.000Z");
    expect(stored[1].nextAction).toBeUndefined();
    expect(stored[1].dueAt).toBeUndefined();
  });

  test("importFromJson ignores unknown keys", () => {
    const snapshot = {
      messages: [
        {
          id: "m1",
          connector: "email",
          content: "hello",
          status: "unread",
          replies: [
            { id: "r1", content: "thanks", sentAt: "2023-01-01T00:00:00.000Z" },
          ],
        },
      ],
      unknownKey: { foo: "bar" },
    };

    importFromJson(JSON.stringify(snapshot));

    const messages = loadItem<Message[]>("messages", MESSAGES_VERSION)!;
    expect(messages).toHaveLength(1);
    expect(localStorage.getItem("unknownKey")).toBeNull();
  });

  test("importFromJson ignores malformed json", () => {
    expect(() => importFromJson("{invalid")).not.toThrow();
    expect(localStorage.length).toBe(0);
  });

  test("current compensation save and load", () => {
    const comp = { salary: "100k", benefits: "health", stock: "50" };
    saveCurrentCompensation(comp);
    expect(getCurrentCompensation()).toEqual(comp);
  });

  test("connector sync snapshot save and load", () => {
    const snapshot: ConnectorSyncSnapshot = {
      linkedin: {
        status: "success",
        lastAttemptedAt: "2024-02-01T00:00:00.000Z",
        lastSuccessfulAt: "2024-02-01T00:00:00.000Z",
      },
      indeed: {
        status: "error",
        lastAttemptedAt: "2024-02-02T00:00:00.000Z",
        error: "network",
      },
    };

    saveConnectorSyncSnapshot(snapshot);
    expect(getConnectorSyncSnapshot()).toEqual(snapshot);
  });

  test("linkedin profile snapshot save and load", () => {
    const snapshot: LinkedInProfileSnapshot = {
      capturedAt: "2024-02-03T00:00:00.000Z",
      profile: {
        id: "ln-1",
        firstName: "Ada",
        lastName: "Lovelace",
        headline: "Pioneer",
      },
      listings: [
        {
          title: "Engineer",
          company: "Acme",
          location: "Remote",
          url: "https://example.com/1",
          source: "linkedin",
        },
      ],
    };

    saveLinkedInProfileSnapshot(snapshot);
    expect(getLinkedInProfileSnapshot()).toEqual(snapshot);
  });

  test("setGoals saves normalized selections", () => {
    localStorage.setItem(
      "talentforge-goal-selections",
      JSON.stringify({ version: 1, data: ["resume"] }),
    );

    setGoals(["resume", "networking", "resume"]);

    const stored = loadItem<string[]>("talentforge-goals", GOALS_VERSION)!;
    expect(stored).toEqual(["resume", "networking"]);
    expect(localStorage.getItem("talentforge-goal-selections")).toBeNull();
  });

  test("getGoals migrates legacy selections", () => {
    saveItem("talentforge-goal-selections", ["networking", "search"], 1);

    const goals = getGoals();
    expect(goals).toEqual(["networking", "search"]);

    const stored = loadItem<string[]>("talentforge-goals", GOALS_VERSION)!;
    expect(stored).toEqual(["networking", "search"]);
    expect(localStorage.getItem("talentforge-goal-selections")).toBeNull();
  });

  test("bulkUpdateJobApplicationStatus updates multiple records", () => {
    const apps = [
      createApplication("app-1"),
      createApplication("app-2", {
        status: "interview",
        history: [
          { status: "applied", changedAt: "2024-01-01T00:00:00.000Z" },
          { status: "interview", changedAt: "2024-01-05T00:00:00.000Z" },
        ],
      }),
    ];
    saveItem("jobApplications", apps, APPLICATIONS_VERSION);

    const updated = bulkUpdateJobApplicationStatus(
      ["app-1", "app-2"],
      "offer",
      { reason: "Accepted" },
    );

    expect(updated.map((app) => app.status)).toEqual(["offer", "offer"]);
    updated.forEach((app) => {
      const last = app.history[app.history.length - 1];
      expect(last.status).toBe("offer");
      expect(last.reason).toBe("Accepted");
    });

    expect(getJobApplications()).toEqual(updated);
  });

  test("bulkUpdateJobApplications persists resume assignments", () => {
    const apps = [createApplication("app-1"), createApplication("app-2")];
    saveItem("jobApplications", apps, APPLICATIONS_VERSION);

    const resume = createResume("resume-1", {
      title: "Frontend Resume",
      label: "Frontend Resume",
    });

    const assigned = bulkUpdateJobApplications(["app-1", "app-2"], {
      resumeVariant: resume,
    });

    assigned.forEach((app) => {
      expect(app.resumeVariant?.id).toBe("resume-1");
    });

    expect(getJobApplications()).toEqual(assigned);

    const cleared = bulkUpdateJobApplications(["app-1"], {
      resumeVariant: undefined,
    });

    const appOne = cleared.find((app) => app.id === "app-1");
    const appTwo = cleared.find((app) => app.id === "app-2");
    expect(appOne?.resumeVariant).toBeUndefined();
    expect(appTwo?.resumeVariant?.id).toBe("resume-1");
    expect(getJobApplications()).toEqual(cleared);
  });
});
