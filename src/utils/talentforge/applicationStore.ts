import type {
  ApplicationStatus,
  JobApplication,
} from "@/types/talentforge";

const STORAGE_KEY = "jobApplications";

export function getJobApplications(): JobApplication[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as JobApplication[];
  } catch {
    return [];
  }
}

function setJobApplications(apps: JobApplication[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
): JobApplication[] {
  const apps = getJobApplications().map((app) => {
    if (app.id === id) {
      const history = [
        ...(app.history ?? []),
        { status, changedAt: new Date().toISOString() },
      ];
      return { ...app, status, history };
    }
    return app;
  });
  setJobApplications(apps);
  return apps;
}

export function addJobApplication(app: JobApplication): JobApplication[] {
  const appWithHistory = {
    ...app,
    history: [
      ...(app.history ?? []),
      { status: app.status, changedAt: new Date().toISOString() },
    ],
  };
  const apps = [...getJobApplications(), appWithHistory];
  setJobApplications(apps);
  return apps;
}

