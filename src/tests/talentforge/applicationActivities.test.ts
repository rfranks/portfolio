import { createApplicationTileActivityRecorder } from "@/utils/talentforge/applicationActivities";
import type { ApplicationActivity, JobApplication } from "@/types";

describe("createApplicationTileActivityRecorder", () => {
  let storedApp: JobApplication;
  let updateApplicationMock: jest.Mock<JobApplication[], [string, Partial<JobApplication>]>;
  let onPersistMock: jest.Mock<void, [JobApplication[], JobApplication | null]>;
  let idCounter: number;
  let timestampCounter: number;

  const nextTimestamp = () => {
    const base = new Date("2024-01-01T00:00:00.000Z");
    return new Date(base.getTime() + timestampCounter++ * 86_400_000).toISOString();
  };

  beforeEach(() => {
    storedApp = {
      id: "app-1",
      applicant: { id: "user-1", name: "Test User", email: "test@example.com" },
      role: { id: "role-1", title: "Engineer", company: "Acme Corp" },
      status: "applied",
      history: [],
      activities: [],
    } as JobApplication;
    idCounter = 0;
    timestampCounter = 0;
    onPersistMock = jest.fn();
    updateApplicationMock = jest.fn((_, updates) => {
      const nextActivities = (updates.activities as ApplicationActivity[]) ?? [];
      storedApp = {
        ...storedApp,
        ...updates,
        activities: nextActivities,
      } as JobApplication;
      return [storedApp];
    });
  });

  it("records successful tile activity runs", () => {
    const recorder = createApplicationTileActivityRecorder(
      {
        application: storedApp,
        tileId: "coverLetter",
        tileLabel: "Cover Letter",
        onPersist: onPersistMock,
      },
      {
        updateApplication: updateApplicationMock,
        createId: () => `activity-${++idCounter}`,
        now: nextTimestamp,
      },
    );

    const updatedApp = recorder.recordSuccess({
      summary: "Generated cover letter",
      generatedContentId: "content-1",
    });

    expect(updateApplicationMock).toHaveBeenCalledWith("app-1", {
      activities: [
        {
          id: "activity-1",
          tileId: "coverLetter",
          createdAt: "2024-01-01T00:00:00.000Z",
          summary: "Generated cover letter",
          outcome: "success",
          generatedContentId: "content-1",
        },
      ],
    });
    expect(updatedApp).toEqual(storedApp);
    expect(storedApp.activities).toHaveLength(1);
    expect(onPersistMock).toHaveBeenCalledWith([storedApp], storedApp);
  });

  it("records error activities when tile execution fails", () => {
    const recorder = createApplicationTileActivityRecorder(
      {
        application: storedApp,
        tileId: "coverLetter",
        tileLabel: "Cover Letter",
        onPersist: onPersistMock,
      },
      {
        updateApplication: updateApplicationMock,
        createId: () => `activity-${++idCounter}`,
        now: nextTimestamp,
      },
    );

    recorder.recordSuccess({ summary: "Generated cover letter" });
    recorder.recordError(new Error("Network unavailable"));

    expect(storedApp.activities).toHaveLength(2);
    const [successEntry, errorEntry] = storedApp.activities!;
    expect(successEntry.outcome).toBe("success");
    expect(errorEntry).toMatchObject({
      id: "activity-2",
      tileId: "coverLetter",
      createdAt: "2024-01-02T00:00:00.000Z",
      summary: "Cover Letter failed",
      outcome: "error",
      error: "Network unavailable",
    });
    expect(updateApplicationMock).toHaveBeenCalledTimes(2);
    expect(onPersistMock).toHaveBeenCalledTimes(2);
  });
});
