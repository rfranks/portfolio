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
  getOffers,
  getJobApplications,
  updateJobApplication,
  getMessages,
  getPipelineLayoutPreferences,
  savePipelineLayoutPreferences,
  PIPELINE_LAYOUT_VERSION,
  NEGOTIATION_LIBRARY_VERSION,
  getNegotiationLibrary,
  addNegotiationLibraryEntry,
  updateNegotiationLibraryEntry,
  deleteNegotiationLibraryEntry,
  SNAPSHOT_VERSION,
  APP_VERSION,
} from "../../utils/talentforge/dataStore";
import type { PipelineLayoutPreferences } from "../../utils/talentforge/dataStore";
import { loadItem, saveItem } from "../../utils/storage";
import type {
  ResumeEntry,
  ConnectorSyncSnapshot,
  LinkedInProfileSnapshot,
  JobApplication,
  Offer,
  NegotiationLibraryEntry,
} from "../../types";
import { exportSnapshot, importSnapshot } from "../../utils/talentforge/snapshot";
import { STATUSES } from "../../utils/talentforge/keyboard";

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
    attachments: overrides.attachments ?? [],
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

function createOffer(
  id: string,
  application: JobApplication,
  overrides: Partial<Offer> = {},
): Offer {
  const base: Offer = {
    id,
    application,
    compensation: [],
    summary: [],
  } as Offer;
  return { ...base, ...overrides } as Offer;
}

describe("dataStore migrations", () => {
  beforeEach(() => {
    localStorage.clear();
    (window as unknown as { alert: () => void }).alert =
      typeof window.alert === "function" ? window.alert : () => {};
  });

  test("importFromJson migrates legacy snapshot", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
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
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test("importFromJson populates connector snapshot defaults", () => {
    const snapshot = {
      version: 5,
      data: {},
      exportedAt: "2024-01-01T00:00:00.000Z",
      appVersion: "0.0.1",
      notes: "legacy export",
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
        exportedAt: "2024-02-01T00:00:00.000Z",
        appVersion: "0.0.1",
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

  test("getOffers normalizes decision data", () => {
    const app = createApplication("offer-app");
    const decidedAtInput = "2024-05-02T09:30:00-04:00";
    const offers: Offer[] = [
      createOffer("offer-1", app),
      createOffer("offer-2", app, {
        decision: {
          status: "accepted",
          decidedAt: decidedAtInput,
          notes: "  Signed  ",
        },
      }),
    ];

    saveItem("offers", offers, OFFERS_VERSION);

    const normalized = getOffers();
    expect(normalized).toHaveLength(2);
    expect(normalized[0].decision).toEqual({ status: "undecided" });
    expect(normalized[1].decision).toEqual({
      status: "accepted",
      decidedAt: new Date(decidedAtInput).toISOString(),
      notes: "Signed",
    });

    const storedOffers = loadItem<Offer[]>("offers", OFFERS_VERSION)!;
    expect(storedOffers[0].decision?.status).toBe("undecided");
    expect(storedOffers[1].decision).toEqual({
      status: "accepted",
      decidedAt: new Date(decidedAtInput).toISOString(),
      notes: "Signed",
    });
  });

  test("getJobApplications migrates decisions and syncs offers", () => {
    const decidedAtInput = "2024-06-01T14:15:00-04:00";
    const baseAppWithOffer = createApplication("app-with-offer");
    const offerWithDecision = createOffer("offer-with-decision", baseAppWithOffer, {
      decision: {
        status: "declined",
        decidedAt: decidedAtInput,
        notes: "  Found another role ",
      },
    });
    const baseAppWithoutDecision = createApplication("app-without-decision");

    const legacyApps: JobApplication[] = [
      { ...baseAppWithOffer, offer: offerWithDecision },
      baseAppWithoutDecision,
    ];

    saveItem("jobApplications", legacyApps, APPLICATIONS_VERSION - 1);

    const applications = getJobApplications();
    expect(applications).toHaveLength(2);

    const [withOffer, withoutOffer] = applications;

    expect(withOffer.decision).toEqual({
      status: "declined",
      decidedAt: new Date(decidedAtInput).toISOString(),
      notes: "Found another role",
    });
    expect(withOffer.offer?.decision).toEqual(withOffer.decision);

    expect(withoutOffer.decision).toEqual({ status: "undecided" });
    expect(withoutOffer.offer).toBeUndefined();

    const storedApps = loadItem<JobApplication[]>(
      "jobApplications",
      APPLICATIONS_VERSION,
    )!;
    expect(storedApps[0].decision?.status).toBe("declined");
    expect(storedApps[0].offer?.decision?.status).toBe("declined");
    expect(storedApps[1].decision?.status).toBe("undecided");
  });

  test("updateJobApplication normalizes decision updates and syncs offer", () => {
    const baseApp = createApplication("app-update");
    const initialApp: JobApplication = {
      ...baseApp,
      decision: { status: "undecided" },
      offer: createOffer("offer-update", baseApp, {
        decision: { status: "undecided" },
      }),
    };

    saveItem("jobApplications", [initialApp], APPLICATIONS_VERSION);

    const decidedAtInput = "2024-07-04T08:00:00-04:00";
    const updated = updateJobApplication("app-update", {
      decision: {
        status: "accepted",
        decidedAt: decidedAtInput,
        notes: "  Signed contract  ",
      },
    });

    const target = updated.find((app) => app.id === "app-update");
    expect(target?.decision).toEqual({
      status: "accepted",
      decidedAt: new Date(decidedAtInput).toISOString(),
      notes: "Signed contract",
    });
    expect(target?.offer?.decision).toEqual(target?.decision);

    const cleared = updateJobApplication("app-update", {
      decision: { decidedAt: "", notes: "" },
    }).find((app) => app.id === "app-update");

    expect(cleared?.decision?.status).toBe("accepted");
    expect(cleared?.decision?.decidedAt).toBeUndefined();
    expect(cleared?.decision?.notes).toBeUndefined();
    expect(cleared?.offer?.decision?.decidedAt).toBeUndefined();
    expect(cleared?.offer?.decision?.notes).toBeUndefined();

    const storedApps = loadItem<JobApplication[]>(
      "jobApplications",
      APPLICATIONS_VERSION,
    )!;
    const stored = storedApps.find((app) => app.id === "app-update");
    expect(stored?.decision?.status).toBe("accepted");
    expect(stored?.decision?.decidedAt).toBeUndefined();
    expect(stored?.decision?.notes).toBeUndefined();
  });

  test("bulkUpdateJobApplications applies decision updates", () => {
    const existingDecidedAt = "2024-08-01T10:00:00.000Z";
    const bulkOneBase = createApplication("bulk-1");
    const bulkTwoBase = createApplication("bulk-2");
    const applications: JobApplication[] = [
      {
        ...bulkOneBase,
        decision: { status: "undecided" },
        offer: createOffer("offer-bulk-1", bulkOneBase, {
          decision: { status: "undecided" },
        }),
      },
      {
        ...bulkTwoBase,
        decision: {
          status: "accepted",
          decidedAt: existingDecidedAt,
          notes: "Initial",
        },
        offer: createOffer("offer-bulk-2", bulkTwoBase, {
          decision: {
            status: "accepted",
            decidedAt: existingDecidedAt,
            notes: "Initial",
          },
        }),
      },
    ];

    saveItem("jobApplications", applications, APPLICATIONS_VERSION);

    const updated = bulkUpdateJobApplications(["bulk-1", "bulk-2"], {
      decision: { status: "declined", notes: "  Moving on  " },
    });

    expect(updated.map((app) => app.decision?.status)).toEqual([
      "declined",
      "declined",
    ]);
    updated.forEach((app) => {
      expect(app.decision?.notes).toBe("Moving on");
      expect(app.offer?.decision?.status).toBe("declined");
    });

    const bulkTwo = updated.find((app) => app.id === "bulk-2");
    expect(bulkTwo?.decision?.decidedAt).toBe(existingDecidedAt);

    const storedApps = loadItem<JobApplication[]>(
      "jobApplications",
      APPLICATIONS_VERSION,
    )!;
    storedApps.forEach((app) => {
      expect(app.decision?.status).toBe("declined");
      expect(app.offer?.decision?.status).toBe("declined");
    });
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
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    expect(() => importFromJson("{invalid")).not.toThrow();
    expect(alertSpy).toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    alertSpy.mockRestore();
  });

  test("getMessages falls back when stored data is invalid", () => {
    window.localStorage.setItem(
      "messages",
      JSON.stringify({ version: MESSAGES_VERSION, data: { broken: true } }),
    );

    expect(getMessages()).toEqual([]);

    const stored = window.localStorage.getItem("messages");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.data).toEqual([]);
  });

  test("importFromJson reports invalid records", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const snapshot = {
      version: SNAPSHOT_VERSION,
      data: {
        messages: {
          version: MESSAGES_VERSION,
          data: [
            {
              id: 123,
              threadId: "thread-1",
              senderId: "sender-1",
              sentAt: "2024-01-01T00:00:00.000Z",
              body: "hello",
              connector: "email",
              status: "unread",
              replies: [],
            },
          ],
        },
      },
      exportedAt: "2024-03-01T00:00:00.000Z",
      appVersion: "0.0.1",
    };

    importFromJson(JSON.stringify(snapshot));

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("messages:"),
    );
    expect(getMessages()).toEqual([]);
    expect(window.localStorage.getItem("messages")).toBeNull();
    alertSpy.mockRestore();
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

  test("getPipelineLayoutPreferences returns defaults when empty", () => {
    const prefs = getPipelineLayoutPreferences();
    expect(prefs.order).toEqual(STATUSES);
    expect(prefs.collapsed).toEqual([]);
  });

  test("savePipelineLayoutPreferences normalizes duplicates", () => {
    const custom = {
      order: [STATUSES[2], STATUSES[0], STATUSES[0]],
      collapsed: [STATUSES[2], "unknown"],
    } as unknown as PipelineLayoutPreferences;

    const normalized = savePipelineLayoutPreferences(custom);

    const expectedOrder = [
      STATUSES[2],
      STATUSES[0],
      ...STATUSES.filter(
        (status) => status !== STATUSES[2] && status !== STATUSES[0],
      ),
    ];
    expect(normalized.order).toEqual(expectedOrder);
    expect(normalized.collapsed).toEqual([STATUSES[2]]);

    const stored = loadItem<PipelineLayoutPreferences>(
      "pipelineLayout",
      PIPELINE_LAYOUT_VERSION,
    )!;
    expect(stored).toEqual(normalized);
  });

  test("getPipelineLayoutPreferences migrates stored payload", () => {
    saveItem(
      "pipelineLayout",
      { order: ["offer", "applied"], collapsed: ["offer", "invalid"] },
      0,
    );

    const prefs = getPipelineLayoutPreferences();
    expect(prefs.order[0]).toBe("offer");
    expect(prefs.order).toEqual([
      "offer",
      "applied",
      ...STATUSES.filter((status) => status !== "offer" && status !== "applied"),
    ]);
    expect(prefs.collapsed).toEqual(["offer"]);

    const stored = loadItem<PipelineLayoutPreferences>(
      "pipelineLayout",
      PIPELINE_LAYOUT_VERSION,
    )!;
    expect(stored).toEqual(prefs);
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

  test("exportSnapshot includes metadata", () => {
    jest.useFakeTimers();
    try {
      const now = new Date("2024-04-05T06:07:08.000Z");
      jest.setSystemTime(now);

      const snapshotJson = exportSnapshot({ notes: "  Export check  " });
      const parsed = JSON.parse(snapshotJson) as {
        version?: number;
        exportedAt?: string;
        appVersion?: string;
        notes?: string;
        data?: unknown;
      };

      expect(parsed.version).toBe(SNAPSHOT_VERSION);
      expect(parsed.exportedAt).toBe(now.toISOString());
      expect(parsed.appVersion).toBe(APP_VERSION);
      expect(parsed.notes).toBe("Export check");
      expect(parsed.data).toBeDefined();
    } finally {
      jest.useRealTimers();
    }
  });

  test("attachments persist through snapshot export and import", () => {
    const attachments = [
      {
        id: "att-1",
        name: "offer-letter.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("Offer details", "utf-8").toString("base64"),
      },
      {
        id: "att-2",
        name: "interview-notes.txt",
        mimeType: "text/plain",
        content: Buffer.from("Remember to follow up", "utf-8").toString("base64"),
      },
    ];

    const application = createApplication("app-attachments", { attachments });
    saveItem("jobApplications", [application], APPLICATIONS_VERSION);

    const snapshot = exportSnapshot();

    localStorage.clear();
    importSnapshot(snapshot);

    const restored = getJobApplications();
    expect(restored).toHaveLength(1);
    expect(restored[0].attachments).toEqual(attachments);
  });

  describe("negotiation library helpers", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test("addNegotiationLibraryEntry persists entries", () => {
      const now = new Date().toISOString();
      const entry: NegotiationLibraryEntry = {
        id: "lib-1",
        label: "Counter offer",
        content: "Draft content",
        createdAt: now,
        updatedAt: now,
      };

      const saved = addNegotiationLibraryEntry(entry);
      expect(saved).toEqual([entry]);
      expect(getNegotiationLibrary()).toEqual([entry]);

      const stored = loadItem<NegotiationLibraryEntry[]>(
        "negotiationLibrary",
        NEGOTIATION_LIBRARY_VERSION,
      )!;
      expect(stored).toEqual([entry]);
    });

    test("updateNegotiationLibraryEntry merges updates", () => {
      const now = new Date().toISOString();
      const entry: NegotiationLibraryEntry = {
        id: "lib-1",
        label: "Initial draft",
        content: "Draft content",
        createdAt: now,
        updatedAt: now,
      };
      addNegotiationLibraryEntry(entry);

      const updatedAt = new Date(Date.now() + 5_000).toISOString();
      const updated = updateNegotiationLibraryEntry(entry.id, {
        label: "Updated draft",
        updatedAt,
      });

      expect(updated).toHaveLength(1);
      expect(updated[0].label).toBe("Updated draft");
      expect(updated[0].content).toBe(entry.content);
      expect(getNegotiationLibrary()[0].updatedAt).toBe(updatedAt);
    });

    test("addNegotiationLibraryEntry replaces entries with matching ids", () => {
      const now = new Date().toISOString();
      const first: NegotiationLibraryEntry = {
        id: "lib-duplicate",
        label: "Original draft",
        content: "Original content",
        createdAt: now,
        updatedAt: now,
      };
      const replacement: NegotiationLibraryEntry = {
        ...first,
        label: "Replacement draft",
        content: "Replacement content",
        updatedAt: new Date(Date.now() + 1_000).toISOString(),
      };

      addNegotiationLibraryEntry(first);
      const saved = addNegotiationLibraryEntry(replacement);

      expect(saved).toHaveLength(1);
      expect(saved[0]).toEqual(replacement);
      expect(getNegotiationLibrary()).toEqual([replacement]);
    });

    test("updateNegotiationLibraryEntry ignores undefined fields", () => {
      const now = new Date().toISOString();
      const entry: NegotiationLibraryEntry = {
        id: "lib-undefined",
        label: "Keep label",
        content: "Keep content",
        createdAt: now,
        updatedAt: now,
      };
      addNegotiationLibraryEntry(entry);

      const newerContent = "Revised content";
      const newerUpdatedAt = new Date(Date.now() + 10_000).toISOString();
      const updated = updateNegotiationLibraryEntry(entry.id, {
        label: undefined,
        content: newerContent,
        updatedAt: newerUpdatedAt,
      });

      expect(updated).toHaveLength(1);
      expect(updated[0].label).toBe(entry.label);
      expect(updated[0].content).toBe(newerContent);
      expect(updated[0].updatedAt).toBe(newerUpdatedAt);
    });

    test("negotiation library persists through snapshot export and import", () => {
      const now = new Date().toISOString();
      const entry: NegotiationLibraryEntry = {
        id: "lib-snapshot",
        label: "Snapshot draft",
        content: "Snapshot content",
        createdAt: now,
        updatedAt: now,
      };
      addNegotiationLibraryEntry(entry);

      const snapshot = exportSnapshot();

      localStorage.clear();
      importSnapshot(snapshot);

      expect(getNegotiationLibrary()).toEqual([entry]);
    });

    test("deleteNegotiationLibraryEntry removes entries", () => {
      const now = new Date().toISOString();
      const first: NegotiationLibraryEntry = {
        id: "lib-1",
        label: "First",
        content: "First draft",
        createdAt: now,
        updatedAt: now,
      };
      const second: NegotiationLibraryEntry = {
        id: "lib-2",
        label: "Second",
        content: "Second draft",
        createdAt: now,
        updatedAt: now,
      };
      addNegotiationLibraryEntry(first);
      addNegotiationLibraryEntry(second);

      const remaining = deleteNegotiationLibraryEntry(first.id);
      expect(remaining).toEqual([second]);
      expect(getNegotiationLibrary()).toEqual([second]);
    });
  });
});
