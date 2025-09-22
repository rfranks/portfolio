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
} from "../../utils/talentforge/dataStore";
import { loadItem, saveItem } from "../../utils/storage";
import type { ResumeEntry } from "../../types";

interface Message {
  replies: { body: string }[];
}

interface Offer {
  compensation: { notes: string }[];
}

interface JobApplication {
  role: { title: string };
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

    const apps = loadItem<JobApplication[]>("jobApplications", APPLICATIONS_VERSION)!;
    expect(apps).toHaveLength(1);
    expect(apps[0].role.title).toBe("Engineer");

    const goals = loadItem<string[]>("talentforge-goals", GOALS_VERSION)!;
    expect(goals).toEqual(["resume", "networking"]);
    expect(getGoals()).toEqual(["resume", "networking"]);
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
});
