import fs from "node:fs";
import path from "node:path";
import resumeDataSnapshot from "../../public/personal/data/resumeData.json";
import {
  createPresentationProjectPageData,
  getPresentationProjectContracts,
  getPresentationProjectDeepLinkIndex,
  getPresentationProjectSlugs,
} from "@/components/portfolio/projectPageData";
import { parseResumeDataWithSchema } from "@/consts/resumeDataSchema";
import { migrateResumeData } from "@/utils/data/migrations/resumeDataMigrations";

function cloneSnapshot() {
  return JSON.parse(JSON.stringify(resumeDataSnapshot)) as Record<string, unknown>;
}

function getProjects(input: Record<string, unknown>) {
  return input.projects as Array<Record<string, unknown>>;
}

function getProjectWithDiagrams(input: Record<string, unknown>) {
  const project = getProjects(input).find(
    (entry) => Array.isArray(entry.diagrams) && entry.diagrams.length > 0,
  );
  if (!project) {
    throw new Error("Expected a project with diagrams in the fixture payload.");
  }
  return project;
}

function getProjectWithLegacyDiagrams(input: Record<string, unknown>) {
  const project = getProjects(input).find((entry) =>
    [entry.blockDiagram, entry.componentDiagram, entry.sequenceDiagram].some(
      (value) => typeof value === "string" && value.trim().length > 0,
    ),
  );
  if (!project) {
    throw new Error("Expected a project with legacy diagram fields in the fixture payload.");
  }
  return project;
}

function parseMigrated(input: Record<string, unknown>, source = "resumeDataSchema.test") {
  return parseResumeDataWithSchema(migrateResumeData(input), source);
}

function expectSchemaFailure(
  mutate: (input: Record<string, unknown>) => void,
  expectedPathPattern: RegExp,
) {
  const malformed = cloneSnapshot();
  mutate(malformed);
  expect(() => parseMigrated(malformed, "resumeDataSchema.test malformed")).toThrow(
    expectedPathPattern,
  );
}

describe("resumeDataSchema hardening and edge cases", () => {
  it("accepts the actual resumeData.json file from disk", () => {
    const resumeDataPath = path.resolve(
      process.cwd(),
      "public",
      "personal",
      "data",
      "resumeData.json",
    );
    const rawText = fs.readFileSync(resumeDataPath, "utf8");
    const rawData = JSON.parse(rawText) as Record<string, unknown>;

    expect(() => parseMigrated(rawData, "resumeDataSchema.test disk file")).not.toThrow();
  });

  it("accepts the current migrated resumeData snapshot", () => {
    expect(() => parseMigrated(cloneSnapshot(), "resumeDataSchema.test snapshot")).not.toThrow();
  });

  it("assigns latest schema version when schemaVersion is missing", () => {
    const input = cloneSnapshot();
    delete input.schemaVersion;

    const parsed = parseMigrated(input, "resumeDataSchema.test missing version");
    expect(parsed.schemaVersion).toBe(2);
  });

  it("migrates legacy github achievement path typo from v1 payloads", () => {
    const input = cloneSnapshot();
    input.schemaVersion = 1;
    const recognition = input.recognition as Record<string, unknown>;
    const achievements = recognition.githubAchievements as Array<Record<string, unknown>>;
    achievements[0].imageSrcUrl = "/personal/images/github/achievments/pull-shark-default.png";

    const parsed = parseMigrated(input, "resumeDataSchema.test legacy migration");
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.recognition.githubAchievements?.[0]?.imageSrcUrl).toContain("/achievements/");
  });

  it("accepts optional branches when they are omitted", () => {
    const input = cloneSnapshot();
    const summary = input.summary as Record<string, unknown>;
    const project = (input.projects as Array<Record<string, unknown>>)[0];
    delete summary.contact;
    delete project.terminalDemo;
    delete project.diagrams;
    delete project.watermark;
    delete input.schemaVersion;

    expect(() => parseMigrated(input, "resumeDataSchema.test optional omissions")).not.toThrow();
  });

  it("rejects unknown top-level keys because schema is strict", () => {
    expectSchemaFailure((input) => {
      input.unexpectedTopLevelKey = true;
    }, /unexpectedTopLevelKey/i);
  });

  it("rejects missing required top-level section", () => {
    expectSchemaFailure((input) => {
      delete input.projectsSection;
    }, /projectsSection/i);
  });

  it("rejects unknown nested keys in strict objects", () => {
    expectSchemaFailure((input) => {
      const summary = input.summary as Record<string, unknown>;
      summary.unknownField = "nope";
    }, /summary/i);
  });

  it("rejects whitespace-only required strings", () => {
    expectSchemaFailure((input) => {
      const summary = input.summary as Record<string, unknown>;
      summary.name = "   ";
    }, /summary\.name/i);
  });

  it("rejects malformed projects collection type", () => {
    expectSchemaFailure((input) => {
      input.projects = "not-an-array";
    }, /projects/i);
  });

  it("rejects malformed project terminalDemo shape", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      projects[0].terminalDemo = {
        mediaType: "video",
        mediaUrl: 42,
        caption: "Caption",
      };
    }, /projects\.0\.terminalDemo\.mediaUrl/i);
  });

  it("rejects malformed project sectionPagerSfx value types", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      projects[0].sectionPagerSfx = {
        overview: 42,
      };
    }, /projects\.0\.sectionPagerSfx\.overview/i);
  });

  it("accepts random project sectionPagerSfx values", () => {
    const input = cloneSnapshot();
    const projects = input.projects as Array<Record<string, unknown>>;
    projects[0].sectionPagerSfx = {
      overview: "random",
      why: "random",
      demo: "/audio/select_001.ogg",
      technologies: "random",
      specifications: "/audio/tick_002.mp3",
      diagrams: "random",
    };

    expect(() => parseMigrated(input, "resumeDataSchema.test random section sfx")).not.toThrow();
  });

  it("rejects non-audio project sectionPagerSfx paths", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      projects[0].sectionPagerSfx = {
        overview: "/images/not-a-sound.png",
      };
    }, /projects\.0\.sectionPagerSfx\.overview/i);
  });

  it("rejects unknown keys in project sectionPagerSfx", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      projects[0].sectionPagerSfx = {
        overview: "/audio/open_003.ogg",
        custom: "/audio/select_004.ogg",
      };
    }, /projects\.0\.sectionPagerSfx/i);
  });

  it("rejects blank competency emoji values", () => {
    expectSchemaFailure((input) => {
      const competencies = input.competencies as Record<string, unknown>;
      const categories = competencies.categories as Array<Record<string, unknown>>;
      const firstCategory = categories[0];
      const items = firstCategory.items as Array<Record<string, unknown>>;
      items[0].emoji = "   ";
    }, /competencies\.categories\.0\.items\.0\.emoji/i);
  });

  it("rejects blank project technology emoji values", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      const project = projects.find((entry) => Array.isArray(entry.technologiesUsed));
      if (!project) {
        throw new Error("Expected at least one project with technologiesUsed.");
      }
      const technologiesUsed = project.technologiesUsed as Array<Record<string, unknown>>;
      technologiesUsed[0].emoji = "   ";
    }, /projects\.\d+\.technologiesUsed\.0\.emoji/i);
  });

  it("rejects malformed navigation icon type", () => {
    expectSchemaFailure((input) => {
      const navigation = input.navigation as Record<string, unknown>;
      const drawerItems = navigation.drawerItems as Array<Record<string, unknown>>;
      drawerItems[0].iconType = "not-a-real-icon-type";
    }, /navigation\.drawerItems\.0\.iconType/i);
  });

  it("rejects invalid diagram type enum values", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.diagrams = [
        {
          title: "Invalid diagram type",
          shortText: "Invalid type for test coverage",
          description: "Invalid type for test coverage",
          diagram: "flowchart TB\nA --> B",
          selectorOptionVisual: {
            type: "emoji",
            icon: "🧪",
          },
          type: "not-a-real-mermaid-diagram-type",
        },
      ];
    }, /projects\.0\.diagrams\.0\.type/i);
  });

  it("rejects cardsFan watermark variants with no cards", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.watermark = {
        kind: "cardsFan",
        cards: [],
      };
    }, /projects\.0\.watermark\.cards/i);
  });

  it("rejects watermark variants with unsupported kind", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.watermark = {
        kind: "video",
      };
    }, /projects\.0\.watermark/i);
  });

  it("rejects blank project type values", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.type = "   ";
    }, /projects\.0\.type/i);
  });

  it("rejects project types outside the strict personal/work/presentation enum", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.type = "prototype";
    }, /projects\.0\.type/i);
  });

  it("requires presentationOrigin for presentation projects", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>).find(
        (entry) => entry.type === "presentation",
      );
      if (!project) {
        throw new Error("No presentation project available for test.");
      }
      delete project.presentationOrigin;
    }, /presentationOrigin/i);
  });

  it("rejects presentationOrigin on non-presentation projects", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>).find(
        (entry) => entry.type !== "presentation",
      );
      if (!project) {
        throw new Error("No non-presentation project available for test.");
      }
      project.presentationOrigin = "work";
    }, /presentationOrigin/i);
  });

  it("rejects diagrams that omit shortText", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      delete diagrams[0].shortText;
    }, /projects\.\d+\.diagrams\.0\.shortText/i);
  });

  it("rejects diagrams that omit description", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      delete diagrams[0].description;
    }, /projects\.\d+\.diagrams\.0\.description/i);
  });

  it("rejects diagrams that omit selector option visuals", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      delete diagrams[0].selectorOptionVisual;
    }, /projects\.\d+\.diagrams\.0\.selectorOptionVisual/i);
  });

  it("rejects emoji diagram visuals without icon", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      diagrams[0].selectorOptionVisual = {
        type: "emoji",
      };
    }, /projects\.\d+\.diagrams\.0\.selectorOptionVisual\.icon/i);
  });

  it("rejects image diagram visuals without src and alt", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      diagrams[0].selectorOptionVisual = {
        type: "image",
      };
    }, /projects\.\d+\.diagrams\.0\.selectorOptionVisual\.(src|alt)/i);
  });

  it("rejects image diagram visuals when icon is also provided", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      diagrams[0].selectorOptionVisual = {
        type: "image",
        src: "/personal/images/example.png",
        alt: "Example",
        icon: "🧩",
      };
    }, /projects\.\d+\.diagrams\.0\.selectorOptionVisual\.icon/i);
  });

  it("rejects projects with legacy block/component/sequence diagrams but missing normalized diagrams array", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithLegacyDiagrams(input);
      delete project.diagrams;
    }, /projects\.\d+\.diagrams/i);
  });

  it("rejects duplicate diagram titles within a project", () => {
    expectSchemaFailure((input) => {
      const project = getProjectWithDiagrams(input);
      const diagrams = project.diagrams as Array<Record<string, unknown>>;
      diagrams[1].title = String(diagrams[0].title);
    }, /projects\.\d+\.diagrams\.1\.title/i);
  });

  it("rejects duplicate project href values", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      projects[1].href = String(projects[0].href);
    }, /projects\.1\.href/i);
  });

  it("rejects mismatched terminalDemo.mediaUrl and demoVideoUrl", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      const demoProject = projects.find(
        (project) => typeof project.href === "string" && project.href === "/blackjack",
      )!;
      demoProject.demoVideoUrl = "/personal/demovideos/one.mov";
      demoProject.terminalDemo = {
        mediaType: "video",
        mediaUrl: "/personal/demovideos/two.mov",
        caption: "Caption",
      };
    }, /terminalDemo\.mediaUrl/i);
  });

  it("rejects mismatched terminalDemo.mediaUrl and demoGifUrl for image demos", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      const demoProject = projects.find(
        (project) => typeof project.href === "string" && project.href === "/patientlist",
      )!;
      demoProject.demoGifUrl = "/personal/demogifs/one.gif";
      demoProject.terminalDemo = {
        mediaType: "image",
        mediaUrl: "/personal/demogifs/two.gif",
        caption: "Caption",
      };
    }, /terminalDemo\.mediaUrl/i);
  });

  it("enforces presentation project content + media contracts", () => {
    const parsed = parseMigrated(cloneSnapshot(), "resumeDataSchema.test presentation contract");
    const presentationProjects = parsed.projects.filter(
      (project) => project.type === "presentation",
    );
    expect(presentationProjects.length).toBeGreaterThan(0);

    const imagePathPattern = /^\/.+\.(gif|png|jpe?g|webp|avif|svg)(?:\?.*)?$/i;
    const videoPathPattern = /^\/.+\.(mp4|mov|m4v|webm|ogv|ogg)(?:\?.*)?$/i;

    presentationProjects.forEach((project) => {
      const hasDemoMedia = Boolean(
        project.terminalDemo?.mediaUrl?.trim() ||
        project.demoVideoUrl?.trim() ||
        project.demoGifUrl?.trim(),
      );
      const hasDiagramMedia =
        (project.diagrams?.length ?? 0) > 0 ||
        Boolean(
          project.blockDiagram?.trim() ||
          project.componentDiagram?.trim() ||
          project.sequenceDiagram?.trim(),
        );

      expect(project.description.trim().length).toBeGreaterThan(0);
      expect(project.interestsMeWhy.trim().length).toBeGreaterThan(0);
      expect(project.technologiesUsed?.length ?? 0).toBeGreaterThan(0);
      expect(Object.keys(project.specifications ?? {}).length).toBeGreaterThan(0);
      expect(hasDemoMedia).toBe(true);
      expect(hasDiagramMedia).toBe(true);

      if (project.demoVideoUrl) {
        expect(project.demoVideoUrl).toMatch(videoPathPattern);
      }
      if (project.demoGifUrl) {
        expect(project.demoGifUrl).toMatch(imagePathPattern);
      }

      if (project.terminalDemo) {
        const mediaPath = project.terminalDemo.mediaUrl;
        if (project.terminalDemo.mediaType === "video") {
          expect(mediaPath).toMatch(videoPathPattern);
        } else {
          expect(mediaPath).toMatch(imagePathPattern);
        }
      }

      project.diagrams?.forEach((diagram) => {
        const visuals = [diagram.selectorOptionVisual, diagram.selectorSelectedVisual].filter(
          Boolean,
        );
        visuals.forEach((visual) => {
          if (visual?.type === "image") {
            expect(visual.src).toMatch(imagePathPattern);
            expect(visual.alt?.trim().length ?? 0).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  it("builds valid deep links for all presentation projects/slides/diagrams", () => {
    const slugs = getPresentationProjectSlugs();
    const contracts = getPresentationProjectContracts();
    const deepLinks = getPresentationProjectDeepLinkIndex();

    expect(slugs.length).toBeGreaterThan(0);
    expect(contracts.length).toBe(slugs.length);
    expect(deepLinks.length).toBeGreaterThan(0);

    const contractBySlug = new Map(contracts.map((contract) => [contract.projectSlug, contract]));

    deepLinks.forEach((entry) => {
      const contract = contractBySlug.get(entry.projectSlug);
      expect(contract).toBeDefined();

      const resolvedProject = createPresentationProjectPageData(entry.projectSlug);
      expect(resolvedProject).not.toBeNull();

      const href = new URL(entry.href, "https://portfolio.test");
      expect(href.pathname).toBe(`/${entry.projectSlug}`);
      expect(href.searchParams.get("project")).toBe(entry.projectSlug);

      const slide = href.searchParams.get("slide");
      expect(slide).toBe(entry.slideKey);
      expect(contract?.sections).toContain(entry.slideKey);

      const diagramParam = href.searchParams.get("diagram");
      if (entry.slideKey !== "diagrams" || entry.diagramIndex === undefined) {
        expect(diagramParam).toBeNull();
      } else {
        expect(Number.parseInt(diagramParam ?? "0", 10)).toBe(entry.diagramIndex + 1);
        const diagramTarget = contract?.diagrams[entry.diagramIndex];
        expect(diagramTarget?.key).toBe(entry.diagramKey);
      }
    });
  });

  it("rejects malformed recognition github achievement entry", () => {
    expectSchemaFailure((input) => {
      const recognition = input.recognition as Record<string, unknown>;
      const githubAchievements = recognition.githubAchievements as Array<Record<string, unknown>>;
      delete githubAchievements[0].slug;
    }, /recognition\.githubAchievements\.0\.slug/i);
  });

  it("rejects malformed recognition snippet object variants", () => {
    expectSchemaFailure((input) => {
      const recognition = input.recognition as Record<string, unknown>;
      recognition.snippets = [
        {
          glyph: "⚠️",
        },
      ];
    }, /recognition\.snippets\.0/i);
  });

  it("rejects non-positive episode numbers in ai shenanigan media parts", () => {
    expectSchemaFailure((input) => {
      const aiShenanigans = input.aiShenanigans as Record<string, unknown>;
      const items = aiShenanigans.items as Array<Record<string, unknown>>;
      items[0].episodeMedia = [
        {
          title: "Episode 0",
          src: "/personal/images/ai/episode-0.png",
          episodeNumber: 0,
        },
      ];
    }, /aiShenanigans\.items\.0\.episodeMedia\.0\.episodeNumber/i);
  });

  it("formats parse errors with source prefix and caps listed issues", () => {
    const malformed = {} as Record<string, unknown>;
    const source = "resumeDataSchema.test too many issues";
    let errorMessage = "";

    try {
      parseMigrated(malformed, source);
    } catch (error) {
      errorMessage = (error as Error).message;
    }

    expect(errorMessage).toMatch(new RegExp(`^Invalid ${source} shape:`));
    const details = errorMessage.split(": ").slice(1).join(": ");
    const listedIssues = details
      .split("; ")
      .map((entry) => entry.trim())
      .filter(Boolean);
    expect(listedIssues.length).toBeGreaterThan(0);
    expect(listedIssues.length).toBeLessThanOrEqual(10);
  });
});
