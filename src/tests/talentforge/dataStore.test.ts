import { importFromJson, MESSAGES_VERSION, OFFERS_VERSION, APPLICATIONS_VERSION } from "../../utils/talentforge/dataStore";
import { loadItem } from "../../utils/storage";

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
});
