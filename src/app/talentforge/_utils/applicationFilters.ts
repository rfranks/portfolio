import type { ApplicationStatus, JobApplication } from "@/types";

export type FilterStatus = ApplicationStatus | "all";

export interface ApplicationFilters {
  searchText: string;
  status: FilterStatus;
  company: string;
  recruiterId: string;
  resumeId: string;
}

function buildSearchHaystack(application: JobApplication): string {
  const recruiterFields = (application.recruiters ?? []).flatMap((recruiter) => [
    recruiter.name,
    recruiter.email,
  ]);

  const resumeFields = application.resumeVariant
    ? [
        application.resumeVariant.title,
        application.resumeVariant.label,
        application.resumeVariant.notes,
      ]
    : [];

  const fields = [
    application.role.title,
    application.role.company,
    application.role.location,
    application.role.description,
    ...resumeFields,
    ...recruiterFields,
  ];

  return fields
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

export function filterApplications(
  applications: JobApplication[],
  filters: ApplicationFilters,
): JobApplication[] {
  const search = filters.searchText.trim().toLowerCase();

  return applications.filter((application) => {
    if (filters.status && filters.status !== "all") {
      if (application.status !== filters.status) {
        return false;
      }
    }

    if (filters.company && application.role.company !== filters.company) {
      return false;
    }

    if (filters.recruiterId) {
      const recruiters = application.recruiters ?? [];
      if (!recruiters.some((recruiter) => recruiter.id === filters.recruiterId)) {
        return false;
      }
    }

    if (filters.resumeId) {
      if (application.resumeVariant?.id !== filters.resumeId) {
        return false;
      }
    }

    if (search) {
      const haystack = buildSearchHaystack(application);
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveFilters(filters: ApplicationFilters): boolean {
  return (
    Boolean(filters.searchText.trim()) ||
    (filters.status && filters.status !== "all") ||
    Boolean(filters.company) ||
    Boolean(filters.recruiterId) ||
    Boolean(filters.resumeId)
  );
}
