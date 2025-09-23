import {
  createApplicationTileActivityRecorder,
  type RecordApplicationTileActivityInput,
  type AppendJobApplicationActivityFn,
} from "@/utils/talentforge/applicationActivities";
import type { JobApplication } from "@/types";

describe("createApplicationTileActivityRecorder", () => {
  const baseApplication: JobApplication = {
    id: "app-1",
    applicant: { id: "user-1", name: "Test User", email: "test@example.com" },
    role: {
      id: "role-1",
      title: "Frontend Engineer",
      company: "Acme Corp",
      location: "Remote",
      description: "Build accessible interfaces",
      source: "site",
      url: "https://example.com",
    },
    status: "applied",
    history: [{ status: "applied", changedAt: "2024-01-01T00:00:00.000Z" }],
    activities: [],
  };

  const setup = () => {
    const appendActivity: jest.MockedFunction<AppendJobApplicationActivityFn> =
      jest.fn((applicationId, activity) => [
        { ...baseApplication, id: applicationId, activities: [activity] },
      ]);
    const setApplications = jest.fn();
    const syncApplicationReferences = jest.fn();
    const createId = jest.fn(() => "activity-1");
    const now = jest.fn(() => "2024-01-02T03:04:05.000Z");
    const record = createApplicationTileActivityRecorder({
      appendActivity: appendActivity as unknown as typeof appendActivity,
      setApplications,
      syncApplicationReferences,
      createId,
      now,
    });
    return {
      appendActivity,
      setApplications,
      syncApplicationReferences,
      createId,
      now,
      record,
    };
  };

  const successDetails: RecordApplicationTileActivityInput = {
    tileId: "screenRole",
    summary: "Generated Screen Role",
    status: "success",
    generatedContentRef: { type: "tileResult", id: "result-1", label: "Screen Role" },
  };

  const errorDetails: RecordApplicationTileActivityInput = {
    tileId: "screenRole",
    summary: "Failed to generate Screen Role",
    status: "error",
    error: "API unavailable",
  };

  test("records a successful tile activity", () => {
    const { record, appendActivity, setApplications, syncApplicationReferences } = setup();

    const activity = record("app-1", successDetails);

    expect(activity).toEqual({
      id: "activity-1",
      tileId: "screenRole",
      timestamp: "2024-01-02T03:04:05.000Z",
      summary: "Generated Screen Role",
      source: "ai",
      status: "success",
      generatedContentRef: { type: "tileResult", id: "result-1", label: "Screen Role" },
    });

    expect(appendActivity).toHaveBeenCalledWith("app-1", activity);
    expect(setApplications).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "app-1",
        activities: [activity],
      }),
    ]);
    expect(syncApplicationReferences).toHaveBeenCalledWith(
      expect.any(Array),
      "app-1",
    );
  });

  test("records an error tile activity", () => {
    const { record } = setup();

    const activity = record("app-1", errorDetails);

    expect(activity).toMatchObject({
      id: "activity-1",
      tileId: "screenRole",
      summary: "Failed to generate Screen Role",
      status: "error",
      source: "ai",
      error: "API unavailable",
    });
    expect(activity.generatedContentRef).toBeUndefined();
  });
});
