import type { CompetencyCategory } from "@/components/portfolio/panels/CoreCompetencies";
import type { ProjectData } from "@/types/components/portfolio";

type TechnologyDomainKey = "frontend" | "backend" | "aiData" | "cloud" | "quality" | "other";

type TechnologyDomainConfig = {
  title: string;
  shortText: string;
  pagerEmoji: string;
};

const TECHNOLOGY_DOMAIN_CONFIG: Record<TechnologyDomainKey, TechnologyDomainConfig> = {
  frontend: {
    title: "Frontend & UX",
    shortText: "UI frameworks and client-side rendering",
    pagerEmoji: "🖥️",
  },
  backend: {
    title: "Backend & APIs",
    shortText: "Services, application logic, and transport",
    pagerEmoji: "⚙️",
  },
  aiData: {
    title: "AI & Data",
    shortText: "LLM tooling, storage, and data systems",
    pagerEmoji: "🤖",
  },
  cloud: {
    title: "Cloud & Platform",
    shortText: "Hosting, serverless, and infrastructure",
    pagerEmoji: "☁️",
  },
  quality: {
    title: "Quality & Tooling",
    shortText: "Testing, build, and developer workflow",
    pagerEmoji: "🧪",
  },
  other: {
    title: "Integrations",
    shortText: "Supporting frameworks and connectors",
    pagerEmoji: "🧩",
  },
};

const normalizeTechnologyName = (technologyName: string) => technologyName.toLowerCase();

const classifyTechnologyDomain = (technologyName: string): TechnologyDomainKey => {
  const normalized = normalizeTechnologyName(technologyName);

  if (
    /(react|next\.?js|vue|angular|material ui|mui|tailwind|css|html|handlebars|backbone|expo|react native|frontend|ui)/i.test(
      normalized,
    )
  ) {
    return "frontend";
  }

  if (
    /(langchain|openai|gemini|llm|ai|nlp|postgres|postgresql|mysql|sql|cosmos|mongodb|redis|vector|embedding|data)/i.test(
      normalized,
    )
  ) {
    return "aiData";
  }

  if (
    /(azure|aws|gcp|google cloud|cloud|s3|serverless|functions|docker|kubernetes|container)/i.test(
      normalized,
    )
  ) {
    return "cloud";
  }

  if (
    /(jest|junit|mockito|vitest|cypress|playwright|eslint|prettier|lint|test|maven|turborepo|webpack|github actions|ci\/cd|pipeline|build)/i.test(
      normalized,
    )
  ) {
    return "quality";
  }

  if (
    /(spring|flask|fastapi|nestjs|express|java|python|go|node|api|rest|axios)/i.test(normalized)
  ) {
    return "backend";
  }

  return "other";
};

const resolveTechnologyEmoji = (technologyName: string, configuredEmoji?: string) => {
  const explicit = configuredEmoji?.trim();
  if (explicit) {
    return explicit;
  }

  const normalized = normalizeTechnologyName(technologyName);
  if (/(react|next|frontend|ui|material|tailwind|html|css)/i.test(normalized)) {
    return "🖥️";
  }
  if (/(typescript|javascript|node|npm|yarn|pnpm|turborepo|webpack|vite|build)/i.test(normalized)) {
    return "🛠️";
  }
  if (/(langchain|openai|gemini|llm|ai|rag|nlp|vector|embedding|audio|speech)/i.test(normalized)) {
    return "🤖";
  }
  if (/(azure|aws|cloud|serverless|functions|blob|storage|s3)/i.test(normalized)) {
    return "☁️";
  }
  if (/(postgres|mysql|sql|cosmos|mongo|redis|db|database)/i.test(normalized)) {
    return "🗄️";
  }
  if (/(python|java|flask|spring|nestjs|express|api|rest|axios|fetch)/i.test(normalized)) {
    return "⚙️";
  }
  if (/(jest|junit|mockito|cypress|playwright|test|lint|prettier|eslint)/i.test(normalized)) {
    return "✅";
  }
  if (/(mermaid|diagram)/i.test(normalized)) {
    return "🧭";
  }
  return "✨";
};

export const resolveTechnologyCompetencyCategories = (
  technologiesUsed: ProjectData["technologiesUsed"],
): CompetencyCategory[] => {
  const grouped = technologiesUsed.reduce<
    Record<TechnologyDomainKey, ProjectData["technologiesUsed"]>
  >(
    (accumulator, technology) => {
      const domainKey = classifyTechnologyDomain(technology.name);
      accumulator[domainKey].push(technology);
      return accumulator;
    },
    {
      frontend: [],
      backend: [],
      aiData: [],
      cloud: [],
      quality: [],
      other: [],
    },
  );

  return (Object.keys(TECHNOLOGY_DOMAIN_CONFIG) as TechnologyDomainKey[]).reduce<
    CompetencyCategory[]
  >((categories, domainKey) => {
    const technologies = grouped[domainKey];
    if (technologies.length === 0) {
      return categories;
    }

    const config = TECHNOLOGY_DOMAIN_CONFIG[domainKey];
    categories.push({
      title: config.title,
      shortText: config.shortText,
      emoji: config.pagerEmoji,
      items: technologies.map((technology) => ({
        label: technology.name,
        description: `${config.shortText}.`,
        emoji: resolveTechnologyEmoji(technology.name, technology.emoji),
        sourceLink: technology.url,
      })),
    });

    return categories;
  }, []);
};
