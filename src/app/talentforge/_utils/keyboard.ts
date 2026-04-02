import type { ApplicationStatus } from "@/app/talentforge/_types/job";

export const STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

export function getNextStatus(
  current: ApplicationStatus,
  key: string,
): ApplicationStatus {
  let index = STATUSES.indexOf(current);
  if (key === "ArrowRight" || key === "ArrowDown") index++;
  if (key === "ArrowLeft" || key === "ArrowUp") index--;
  index = Math.max(0, Math.min(STATUSES.length - 1, index));
  return STATUSES[index];
}
