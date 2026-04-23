import type { JsonRecord } from "../lib/metadata-editor";
import type { AppAssetBucket } from "../lib/asset-organizer";

export type ScopedAssetOptions = {
  title: string;
  scopeAbsDir: string;
  webBase: string;
  extensions: Set<string>;
  fallbackRelative: string;
  optional?: boolean;
};

export type ProjectEntry = {
  href: string;
  name: string;
  [key: string]: unknown;
};

export type ShenaniganEntry = {
  slug: string;
  title: string;
  [key: string]: unknown;
};

export type NavigationRoute = {
  label: string;
  href: string;
};

export type ExperienceEntry = {
  company: string;
  position: string;
  location: string;
  start: string;
  end: string;
  details: string[];
  image: string;
};

export type EducationEntry = {
  school: string;
  degree: string;
  year: string;
  awards: string[];
  image: string;
};

export type RecommendationEntry = {
  name: string;
  title: string;
  date: string;
  relationship: string;
  imageSrcUrl?: string;
  text: string;
};

export type RecognitionSnippetEntry = string | { text: string; glyph?: string };

export type CompetencySkillEntry = {
  label: string;
  description: string;
  [key: string]: unknown;
};

export type CompetencyCategoryEntry = {
  title: string;
  shortText?: string;
  subTitle?: string;
  icon?: string;
  items: CompetencySkillEntry[];
  [key: string]: unknown;
};

export type CompetenciesData = {
  categories?: CompetencyCategoryEntry[];
  skills?: string[];
  [key: string]: unknown;
};

export type AppAssetFolderMap = Record<AppAssetBucket, string>;

export type ContactInfo = {
  email?: string;
  linkedin?: string;
  github?: string[];
};

export type SummaryData = {
  name?: string;
  title?: string;
  location?: string;
  contact?: ContactInfo;
  heroOverline?: string;
  documentTitle?: string;
  metadataTitle?: string;
  [key: string]: unknown;
};

export type RecognitionData = {
  snippets?: RecognitionSnippetEntry[];
  recommendations?: RecommendationEntry[];
  [key: string]: unknown;
};

export type AIShenanigansData = {
  items?: ShenaniganEntry[];
  [key: string]: unknown;
};

export type ResumeData = JsonRecord & {
  summary?: SummaryData;
  contactCTA?: JsonRecord;
  hobbies?: JsonRecord;
  aiShenanigans?: AIShenanigansData;
  competencies?: CompetenciesData;
  projects?: ProjectEntry[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  recognition?: RecognitionData;
  navigation?: JsonRecord;
  projectsSection?: JsonRecord;
};

export function defaultProjectDiagrams(projectName: string): {
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
} {
  const safeName = projectName || "Project";
  return {
    blockDiagram:
      `graph TD;\n` +
      `  U[User] --> UI[${safeName} UI];\n` +
      `  UI --> API[Service Layer];\n` +
      `  API --> DB[(Data Store)];`,
    componentDiagram:
      `graph LR;\n` +
      `  A[Page Route] --> B[Client Components];\n` +
      `  B --> C[Shared UI];\n` +
      `  B --> D[Data Adapter];\n` +
      `  D --> E[Resume Data];`,
    sequenceDiagram:
      `sequenceDiagram\n` +
      `  participant U as User\n` +
      `  participant P as Page\n` +
      `  participant D as Data\n\n` +
      `  U->>P: Open route\n` +
      `  P->>D: Load project metadata\n` +
      `  D-->>P: Render payload\n` +
      `  P-->>U: Display project`,
  };
}

export function defaultExperienceTemplate(): ExperienceEntry {
  return {
    company: "Example Company",
    position: "Senior Software Engineer",
    location: "Remote",
    start: "January 2022",
    end: "Present",
    details: [
      "Built production-grade full-stack features from concept to release.",
      "Improved delivery speed through automation, reusable components, and better developer ergonomics.",
    ],
    image: "/personal/images/employers/company-logo.png",
  };
}

export function defaultEducationTemplate(): EducationEntry {
  return {
    school: "Example University",
    degree: "B.S. in Computer Science",
    year: "2018",
    awards: ["Dean's List"],
    image: "/personal/images/personal/education-logo.png",
  };
}

export function defaultRecognitionSnippetTemplate(): string {
  return "Recognized for delivering high-quality product engineering with speed and consistency.";
}

export function normalizeRecognitionSnippet(snippet: RecognitionSnippetEntry): {
  text: string;
  glyph?: string;
} {
  if (typeof snippet === "string") {
    return { text: snippet };
  }
  return {
    text: snippet.text,
    glyph: snippet.glyph,
  };
}

export function formatRecognitionSnippetPreview(snippet: RecognitionSnippetEntry): string {
  const normalized = normalizeRecognitionSnippet(snippet);
  const previewText =
    normalized.text.length > 80 ? `${normalized.text.slice(0, 80)}...` : normalized.text;
  return normalized.glyph ? `${normalized.glyph} ${previewText}` : previewText;
}

export function defaultRecommendationTemplate(): RecommendationEntry {
  return {
    name: "Colleague Name",
    title: "Engineering Leader",
    date: "January 1, 2026",
    relationship: "Worked with me on the same team",
    imageSrcUrl: "/personal/images/colleagues/colleague.jpeg",
    text: "A short recommendation highlighting impact, collaboration, and technical strength.",
  };
}

export function defaultCompetencyCategoryTemplate(): CompetencyCategoryEntry {
  return {
    title: "New Competency Category",
    shortText: "Short one-line summary for pager options.",
    subTitle: "Short one-line summary for pager options.",
    icon: "web",
    items: [
      {
        label: "Example skill",
        description: "Describe the capability shown by this skill.",
      },
    ],
  };
}

export function serializeCompetencyItems(items: CompetencySkillEntry[]): string {
  return (items || []).map((item) => `${item.label}::${item.description}`).join(" | ");
}

export function parseCompetencyItems(inputValue: string): CompetencySkillEntry[] {
  return inputValue
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [rawLabel, ...rawDescription] = segment.split("::");
      const label = rawLabel?.trim() || "";
      const description = rawDescription.join("::").trim();
      return {
        label: label || "Unnamed skill",
        description: description || "Add a short description.",
      };
    });
}
