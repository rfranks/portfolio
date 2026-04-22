import fs from "node:fs";
import path from "node:path";
import resumeDataSnapshot from "../../public/personal/data/resumeData.json";
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
        title: "Demo",
        subtitle: "Subtitle",
        caption: "Caption",
        videoUrl: 42,
      };
    }, /projects\.0\.terminalDemo\.videoUrl/i);
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

  it("rejects project types outside the strict personal/work enum", () => {
    expectSchemaFailure((input) => {
      const project = (input.projects as Array<Record<string, unknown>>)[0];
      project.type = "prototype";
    }, /projects\.0\.type/i);
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

  it("rejects mismatched terminalDemo.videoUrl and demoVideoUrl", () => {
    expectSchemaFailure((input) => {
      const projects = input.projects as Array<Record<string, unknown>>;
      const demoProject = projects.find(
        (project) => typeof project.href === "string" && project.href === "/blackjack",
      )!;
      demoProject.demoVideoUrl = "/personal/demovideos/one.mov";
      demoProject.terminalDemo = {
        title: "Demo",
        subtitle: "Subtitle",
        caption: "Caption",
        videoUrl: "/personal/demovideos/two.mov",
      };
    }, /terminalDemo\.videoUrl/i);
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
