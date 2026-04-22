import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

const contactSchema = z
  .object({
    linkedin: nonEmptyString.optional(),
    email: nonEmptyString.optional(),
    github: z.array(nonEmptyString).optional(),
  })
  .strict();

const summarySchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString,
    heroOverline: nonEmptyString.optional(),
    documentTitle: nonEmptyString.optional(),
    metadataTitle: nonEmptyString.optional(),
    metadataDescription: nonEmptyString.optional(),
    location: nonEmptyString.optional(),
    avatarImage: nonEmptyString.optional(),
    headshotImage: nonEmptyString.optional(),
    resumeUrl: nonEmptyString.optional(),
    contact: contactSchema.optional(),
    gutter: z.array(nonEmptyString).optional(),
  })
  .strict();

const contactCtaSchema = z
  .object({
    title: nonEmptyString,
    body: nonEmptyString,
    primaryLabel: nonEmptyString,
    secondaryLabel: nonEmptyString.optional(),
  })
  .strict();

const portfolioAppSchema = z
  .object({
    description: nonEmptyString.optional(),
    documentTitle: nonEmptyString.optional(),
    metadataTitle: nonEmptyString.optional(),
    metadataDescription: nonEmptyString.optional(),
    appBarSubtitle: nonEmptyString.optional(),
    heroEyebrow: nonEmptyString.optional(),
    interstitialAppName: nonEmptyString.optional(),
    interstitialLogoAlt: nonEmptyString.optional(),
    interstitialLogoSrc: nonEmptyString.optional(),
  })
  .strict();

const portfolioAppsSchema = z.record(nonEmptyString, portfolioAppSchema);

const navIconTypeSchema = z.enum(["material", "emoji", "image"]);

const navIconSchema = z
  .object({
    iconType: navIconTypeSchema,
    icon: nonEmptyString,
  })
  .strict();

const drawerNavItemSchema = navIconSchema
  .extend({
    label: nonEmptyString,
    href: nonEmptyString,
  })
  .strict();

const homeSectionSchema = navIconSchema
  .extend({
    id: nonEmptyString,
    label: nonEmptyString,
  })
  .strict();

const navigationSchema = z
  .object({
    forkRibbon: z
      .object({
        label: nonEmptyString,
        href: nonEmptyString,
      })
      .strict()
      .optional(),
    drawerItems: z.array(drawerNavItemSchema),
    homeSections: z.array(homeSectionSchema),
  })
  .strict();

const competencySkillSchema = z
  .object({
    label: nonEmptyString,
    description: nonEmptyString,
    emoji: nonEmptyString.optional(),
  })
  .strict();

const competencyCategorySchema = z
  .object({
    title: nonEmptyString,
    shortText: nonEmptyString.optional(),
    subTitle: nonEmptyString.optional(),
    icon: nonEmptyString.optional(),
    emoji: nonEmptyString.optional(),
    items: z.array(competencySkillSchema).optional(),
  })
  .strict();

const competenciesSchema = z
  .object({
    categories: z.array(competencyCategorySchema).optional(),
    skills: z.array(nonEmptyString).optional(),
  })
  .strict();

const hobbiesSchema = z
  .object({
    title: nonEmptyString,
    heroImageUrl: nonEmptyString.optional(),
    heroVideoUrl: nonEmptyString.nullable().optional(),
    items: z.array(nonEmptyString),
    introText: nonEmptyString.optional(),
  })
  .strict();

const aiShenaniganMediaPartSchema = z
  .object({
    title: nonEmptyString,
    src: nonEmptyString,
    caption: nonEmptyString.optional(),
    source: nonEmptyString.optional(),
    episodeNumber: z.number().int().positive().optional(),
  })
  .strict();

const aiShenaniganEntrySchema = z
  .object({
    slug: nonEmptyString,
    title: nonEmptyString,
    type: nonEmptyString.optional(),
    orientation: nonEmptyString.optional(),
    shortText: nonEmptyString.optional(),
    blurb: nonEmptyString.optional(),
    realisticImage: nonEmptyString.optional(),
    realisticSource: nonEmptyString.optional(),
    realisticCaption: nonEmptyString.optional(),
    stylizedRendering: nonEmptyString.optional(),
    stylizedSource: nonEmptyString.optional(),
    stylizedSourceHref: nonEmptyString.optional(),
    stylizedCaption: nonEmptyString.optional(),
    movieRendering: nonEmptyString.optional(),
    movieSource: nonEmptyString.optional(),
    movieCaption: nonEmptyString.optional(),
    movieRendering2: nonEmptyString.optional(),
    movieSource2: nonEmptyString.optional(),
    movieCaption2: nonEmptyString.optional(),
    trailerMovie: nonEmptyString.optional(),
    trailerSource: nonEmptyString.optional(),
    trailerCaption: nonEmptyString.optional(),
    trailerOrientation: nonEmptyString.optional(),
    rawImage: nonEmptyString.optional(),
    rawSource: nonEmptyString.optional(),
    rawCaption: nonEmptyString.optional(),
    analyzedImage: nonEmptyString.optional(),
    analyzedSource: nonEmptyString.optional(),
    analyzedSourceHref: nonEmptyString.optional(),
    analyzedCaption: nonEmptyString.optional(),
    palmLineAnalysisImage: nonEmptyString.optional(),
    palmLineAnalysisSource: nonEmptyString.optional(),
    palmLineAnalysisSourceHref: nonEmptyString.optional(),
    palmLineAnalysisCaption: nonEmptyString.optional(),
    palmReadingTitle: nonEmptyString.optional(),
    palmReadingMarkdownPath: nonEmptyString.optional(),
    palmReadingSource: nonEmptyString.optional(),
    palmReadingSourceHref: nonEmptyString.optional(),
    songAudio: nonEmptyString.optional(),
    songAudioSource: nonEmptyString.optional(),
    songAudioCaption: nonEmptyString.optional(),
    songAlbumImage: nonEmptyString.optional(),
    songAlbumSource: nonEmptyString.optional(),
    songLyricsMarkdownPath: nonEmptyString.optional(),
    songLyricsSource: nonEmptyString.optional(),
    songPerformedBy: nonEmptyString.optional(),
    songWrittenBy: nonEmptyString.optional(),
    manuscriptPdf: nonEmptyString.optional(),
    manuscriptSource: nonEmptyString.optional(),
    manuscriptCaption: nonEmptyString.optional(),
    episodesPdf: nonEmptyString.optional(),
    episodesSource: nonEmptyString.optional(),
    episodesCaption: nonEmptyString.optional(),
    episodeMedia: z.array(aiShenaniganMediaPartSchema).optional(),
    seriesParts: z.array(aiShenaniganMediaPartSchema).optional(),
    workParts: z.array(aiShenaniganMediaPartSchema).optional(),
    bookCoverImage: nonEmptyString.optional(),
    bookSource: nonEmptyString.optional(),
    bookCaption: nonEmptyString.optional(),
    pagerOptionImage: nonEmptyString.optional(),
    intentToCopyright: z.boolean().optional(),
    rightsNotice: nonEmptyString.optional(),
  })
  .strict();

const aiShenanigansSchema = z
  .object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
    items: z.array(aiShenaniganEntrySchema),
  })
  .strict();

const watermarkCardSchema = z
  .object({
    src: nonEmptyString,
    alt: nonEmptyString,
    width: z.number().positive(),
    height: z.number().positive(),
    className: nonEmptyString.optional(),
  })
  .strict();

const watermarkImageSchema = z
  .object({
    kind: z.literal("image"),
    src: nonEmptyString,
    alt: nonEmptyString,
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    containerClassName: nonEmptyString.optional(),
    className: nonEmptyString.optional(),
    imageClassName: nonEmptyString.optional(),
  })
  .strict();

const watermarkCardsFanSchema = z
  .object({
    kind: z.literal("cardsFan"),
    containerClassName: nonEmptyString.optional(),
    className: nonEmptyString.optional(),
    cards: z.array(watermarkCardSchema).min(1),
  })
  .strict();

const visualMarkSchema = z.union([watermarkImageSchema, watermarkCardsFanSchema]);

const accoladeSchema = z
  .object({
    name: nonEmptyString,
    source: nonEmptyString,
    sourceUrl: nonEmptyString,
    description: nonEmptyString.optional(),
    comment: nonEmptyString.optional(),
    launchUrl: nonEmptyString.optional(),
    githubUrl: nonEmptyString.optional(),
    imageSrcUrl: nonEmptyString.optional(),
    date: nonEmptyString.optional(),
  })
  .strict();

const projectTechnologySchema = z
  .object({
    name: nonEmptyString,
    url: nonEmptyString.optional(),
    emoji: nonEmptyString.optional(),
  })
  .strict();

const diagramVisualSchema = z
  .object({
    type: navIconTypeSchema,
    icon: nonEmptyString.optional(),
    src: nonEmptyString.optional(),
    alt: nonEmptyString.optional(),
  })
  .superRefine((visual, ctx) => {
    if (visual.type === "image") {
      if (!visual.src) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["src"],
          message: "Image diagram visuals require a src.",
        });
      }
      if (!visual.alt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["alt"],
          message: "Image diagram visuals require alt text.",
        });
      }
      if (visual.icon) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["icon"],
          message: "Image diagram visuals cannot include an icon value.",
        });
      }
      return;
    }

    if (!visual.icon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icon"],
        message: `${visual.type} diagram visuals require an icon.`,
      });
    }
    if (visual.src) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["src"],
        message: `${visual.type} diagram visuals cannot include a src.`,
      });
    }
    if (visual.alt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["alt"],
        message: `${visual.type} diagram visuals cannot include alt text.`,
      });
    }
  })
  .strict();

const diagramTypeSchema = z.enum([
  "classDiagram",
  "erDiagram",
  "flowchart",
  "graph",
  "gantt",
  "gitGraph",
  "journey",
  "mindmap",
  "sequenceDiagram",
  "stateDiagram-v2",
  "timeline",
]);

const projectDiagramSchema = z
  .object({
    title: nonEmptyString,
    shortText: nonEmptyString,
    description: nonEmptyString,
    selectorOptionVisual: diagramVisualSchema,
    selectorSelectedVisual: diagramVisualSchema.optional(),
    type: diagramTypeSchema.optional(),
    height: z.union([z.number().positive(), nonEmptyString]).optional(),
    diagram: nonEmptyString,
    autoFitPadding: z.number().optional(),
    autoFitScaleMultiplier: z.number().optional(),
    autoFitOffsetX: z.number().optional(),
    autoFitOffsetY: z.number().optional(),
  })
  .strict();

const terminalDemoSchema = z
  .object({
    mediaType: z.enum(["video", "image"]),
    mediaUrl: nonEmptyString,
    caption: nonEmptyString,
    title: nonEmptyString.optional(),
    subtitle: nonEmptyString.optional(),
    mediaAlt: nonEmptyString.optional(),
  })
  .strict();

const projectSectionPagerSfxValueSchema = nonEmptyString.refine(
  (value) => value === "random" || /^\/audio\/.+\.(mp3|ogg|wav|m4a)$/i.test(value),
  {
    message:
      "Section pager SFX values must be 'random' or an absolute /audio/*.mp3|ogg|wav|m4a path.",
  },
);

const projectSectionPagerSfxSchema = z
  .object({
    overview: projectSectionPagerSfxValueSchema.optional(),
    why: projectSectionPagerSfxValueSchema.optional(),
    demo: projectSectionPagerSfxValueSchema.optional(),
    technologies: projectSectionPagerSfxValueSchema.optional(),
    specifications: projectSectionPagerSfxValueSchema.optional(),
    diagrams: projectSectionPagerSfxValueSchema.optional(),
  })
  .strict();

const projectEntrySchema = z
  .object({
    name: nonEmptyString,
    showcaseHeading: nonEmptyString.optional(),
    showcaseSubtitle: nonEmptyString.optional(),
    description: nonEmptyString,
    href: nonEmptyString,
    type: z.enum(["personal", "work", "presentation"]),
    interestsMeWhy: nonEmptyString,
    wowFactor: nonEmptyString.optional(),
    demoCaption: nonEmptyString.optional(),
    shortText: nonEmptyString.optional(),
    blurb: nonEmptyString.optional(),
    demoGifUrl: nonEmptyString.optional(),
    demoVideoUrl: nonEmptyString.optional(),
    watermark: z.union([visualMarkSchema, z.null()]).optional(),
    accolades: z.array(accoladeSchema).optional(),
    technologiesUsed: z.array(projectTechnologySchema).optional(),
    specifications: z.record(z.string(), z.unknown()).optional(),
    blockDiagram: nonEmptyString.optional(),
    componentDiagram: nonEmptyString.optional(),
    sequenceDiagram: nonEmptyString.optional(),
    diagrams: z.array(projectDiagramSchema).optional(),
    terminalDemo: terminalDemoSchema.optional(),
    sectionPagerSfx: projectSectionPagerSfxSchema.optional(),
  })
  .superRefine((project, ctx) => {
    const legacyDiagramFields = [
      project.blockDiagram,
      project.componentDiagram,
      project.sequenceDiagram,
    ]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

    if (legacyDiagramFields.length > 0 && (!project.diagrams || project.diagrams.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagrams"],
        message:
          "Projects with legacy diagram fields must also provide a normalized diagrams array.",
      });
    }

    if (project.diagrams?.length) {
      const seenTitles = new Map<string, number>();
      project.diagrams.forEach((diagram, index) => {
        const normalizedTitle = diagram.title.trim().toLowerCase();
        const priorIndex = seenTitles.get(normalizedTitle);
        if (priorIndex !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["diagrams", index, "title"],
            message: `Duplicate diagram title also used at diagrams.${priorIndex}.title`,
          });
          return;
        }
        seenTitles.set(normalizedTitle, index);
      });
    }

    const terminalDemoMediaUrl = project.terminalDemo?.mediaUrl?.trim();
    const demoVideoUrl = project.demoVideoUrl?.trim();
    if (
      project.terminalDemo?.mediaType === "video" &&
      terminalDemoMediaUrl &&
      demoVideoUrl &&
      terminalDemoMediaUrl !== demoVideoUrl
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["terminalDemo", "mediaUrl"],
        message: "terminalDemo.mediaUrl must match demoVideoUrl when mediaType is video.",
      });
    }

    const demoGifUrl = project.demoGifUrl?.trim();
    if (
      project.terminalDemo?.mediaType === "image" &&
      terminalDemoMediaUrl &&
      demoGifUrl &&
      terminalDemoMediaUrl !== demoGifUrl
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["terminalDemo", "mediaUrl"],
        message: "terminalDemo.mediaUrl must match demoGifUrl when mediaType is image.",
      });
    }
  })
  .strict();

const experienceEntrySchema = z
  .object({
    company: nonEmptyString,
    position: z.string().optional(),
    location: nonEmptyString.optional(),
    start: nonEmptyString.optional(),
    end: nonEmptyString.optional(),
    details: z.array(nonEmptyString).optional(),
    achievements: z.array(nonEmptyString).optional(),
    image: nonEmptyString.optional(),
  })
  .strict();

const educationEntrySchema = z
  .object({
    school: nonEmptyString,
    schoolUrl: nonEmptyString.optional(),
    degree: nonEmptyString.optional(),
    year: nonEmptyString.optional(),
    image: nonEmptyString.optional(),
    awards: z.array(nonEmptyString).optional(),
  })
  .strict();

const recognitionSnippetSchema = z.union([
  nonEmptyString,
  z
    .object({
      text: nonEmptyString,
      glyph: nonEmptyString.optional(),
    })
    .strict(),
]);

const recommendationEntrySchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString.optional(),
    date: nonEmptyString.optional(),
    relationship: nonEmptyString.optional(),
    text: nonEmptyString,
    imageSrcUrl: nonEmptyString.optional(),
  })
  .strict();

const githubAchievementSchema = z
  .object({
    name: nonEmptyString,
    slug: nonEmptyString,
    imageSrcUrl: nonEmptyString,
    achievementUrl: nonEmptyString,
    source: nonEmptyString,
    tier: nonEmptyString.optional(),
  })
  .strict();

const recognitionSchema = z
  .object({
    snippets: z.array(recognitionSnippetSchema).optional(),
    githubAchievements: z.array(githubAchievementSchema).optional(),
    recommendations: z.array(recommendationEntrySchema).optional(),
  })
  .strict();

const projectsSectionSchema = z
  .object({
    title: nonEmptyString,
    descriptionLines: z.array(nonEmptyString),
    launchLabel: nonEmptyString,
    interestHeading: nonEmptyString,
    accoladesHeading: nonEmptyString,
    marks: z.array(visualMarkSchema).optional(),
  })
  .strict();

export const resumeDataSchema = z
  .object({
    schemaVersion: z.number().int().positive().optional(),
    summary: summarySchema,
    contactCTA: contactCtaSchema,
    portfolioApps: portfolioAppsSchema,
    navigation: navigationSchema,
    competencies: competenciesSchema,
    coreCompetencies: z.array(nonEmptyString),
    hobbies: hobbiesSchema,
    aiShenanigans: aiShenanigansSchema,
    projects: z.array(projectEntrySchema),
    experience: z.array(experienceEntrySchema),
    recognition: recognitionSchema,
    education: z.array(educationEntrySchema),
    projectsSection: projectsSectionSchema,
  })
  .superRefine((data, ctx) => {
    const seenProjectHrefs = new Map<string, number>();
    data.projects.forEach((project, index) => {
      const priorIndex = seenProjectHrefs.get(project.href);
      if (priorIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["projects", index, "href"],
          message: `Duplicate project href also used at projects.${priorIndex}.href`,
        });
        return;
      }
      seenProjectHrefs.set(project.href, index);
    });
  })
  .strict();

export type ResumeDataSchemaType = z.infer<typeof resumeDataSchema>;

const formatZodIssues = (issues: z.ZodIssue[]) =>
  issues
    .slice(0, 10)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

export function parseResumeDataWithSchema(
  input: unknown,
  source = "resumeData",
): ResumeDataSchemaType {
  const parsed = resumeDataSchema.safeParse(input);
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error.issues);
    throw new Error(`Invalid ${source} shape: ${details}`);
  }
  return parsed.data;
}
