import { v4 as uuid } from "uuid";
import type { JobApplication } from "@/types";
import { addJobApplication } from "@/app/talentforge/_utils/dataStore";
import { fetchAllListings } from "@/app/talentforge/_utils/jobAggregator";

type FetchListingsFn = typeof fetchAllListings;
type AddApplicationFn = typeof addJobApplication;

interface ListingsLoaderOptions {
  existingApplications: JobApplication[];
  fetchListings: FetchListingsFn;
  addApplication: AddApplicationFn;
  createId?: () => string;
  now?: () => string;
  logger?: (message: string, error: unknown) => void;
}

interface ListingsLoaderResult {
  applications: JobApplication[];
  error: Error | null;
  loading: boolean;
}

export async function loadListingsWhenEmpty({
  existingApplications,
  fetchListings,
  addApplication,
  createId = uuid,
  now = () => new Date().toISOString(),
  logger = (message: string, error: unknown) => console.error(message, error),
}: ListingsLoaderOptions): Promise<ListingsLoaderResult> {
  if (existingApplications.length > 0) {
    return {
      applications: existingApplications,
      error: null,
      loading: false,
    };
  }

  try {
    const listings = await fetchListings("");
    let apps = existingApplications;
    listings.forEach((listing) => {
      const applicationId = createId();
      apps = addApplication({
        id: applicationId,
        applicant: { id: "", name: "", email: "" },
        role: { ...listing, id: createId() },
        status: "applied",
        history: [{ status: "applied", changedAt: now() }],
      });
    });
    return { applications: apps, error: null, loading: false };
  } catch (error) {
    logger("Failed to fetch job listings", error);
    const normalized = error instanceof Error ? error : new Error("Failed to load job listings.");
    return {
      applications: existingApplications,
      error: normalized,
      loading: true,
    };
  }
}
