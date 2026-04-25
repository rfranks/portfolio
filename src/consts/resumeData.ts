import resumeDataSnapshot from "../../public/personal/data/resumeData.json";
import { parseResumeDataWithSchema } from "@/consts/resumeDataSchema";
import type { ResumeDataMigrationPayload } from "@/types/data/migrations/resumeDataMigrations";
import { fetchJson } from "@/utils/network/httpClient";
import { migrateResumeData } from "@/utils/data/migrations/resumeDataMigrations";
import { withBasePath } from "@/utils/basePath";

export const resumeDataPath = "/personal/data/resumeData.json";

const resumeData = parseResumeDataWithSchema(
  migrateResumeData(resumeDataSnapshot as ResumeDataMigrationPayload),
  "bundled resumeData snapshot",
) as typeof resumeDataSnapshot;
export type ResumeData = typeof resumeDataSnapshot;

let resumeDataFetchPromise: Promise<ResumeData> | null = null;

const resolveResumeDataUrl = (baseUrl?: string) => {
  if (baseUrl?.trim()) {
    return new URL(resumeDataPath, baseUrl).toString();
  }

  if (typeof window === "undefined") {
    const explicitOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicitOrigin) {
      return new URL(resumeDataPath, explicitOrigin).toString();
    }
  }

  return withBasePath(resumeDataPath);
};

export async function fetchResumeData(options?: {
  baseUrl?: string;
  cache?: RequestCache;
}): Promise<ResumeData> {
  const { data: payload } = await fetchJson<ResumeDataMigrationPayload>(
    resolveResumeDataUrl(options?.baseUrl),
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: options?.cache ?? "no-store",
      retries: 1,
    },
  );
  return parseResumeDataWithSchema(
    migrateResumeData(payload),
    `resumeData response from ${resolveResumeDataUrl(options?.baseUrl)}`,
  ) as ResumeData;
}

export async function fetchResumeDataCached(options?: {
  baseUrl?: string;
  cache?: RequestCache;
}): Promise<ResumeData> {
  if (!resumeDataFetchPromise) {
    resumeDataFetchPromise = fetchResumeData(options);
  }
  return resumeDataFetchPromise;
}

export default resumeData;

export const summary = resumeData.summary;
export const contactCTA = resumeData.contactCTA;
export const portfolioApps = resumeData.portfolioApps;
export const navigation = resumeData.navigation;
export const competencies = resumeData.competencies;
export const coreCompetencies = resumeData.coreCompetencies;
export const hobbies = resumeData.hobbies;
export const aiShenanigans = resumeData.aiShenanigans;
export const projectsSection = resumeData.projectsSection;
export const experience = resumeData.experience;
export const projects = resumeData.projects;
export const recognition = resumeData.recognition;
export const education = resumeData.education;
