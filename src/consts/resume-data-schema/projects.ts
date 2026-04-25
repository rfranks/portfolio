import { z } from "zod";
import { navIconTypeSchema, nonEmptyString } from "./primitives";

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

export const visualMarkSchema = z.union([watermarkImageSchema, watermarkCardsFanSchema]);

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
    autoFit: z
      .object({
        padding: z.number(),
        scaleMultiplier: z.number(),
        verticalAlign: z.enum(["top", "center"]).optional(),
        offsetX: z.number(),
        offsetY: z.number(),
      })
      .strict()
      .optional(),
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

const projectPresentationSectionKeySchema = z.enum([
  "overview",
  "why",
  "demo",
  "technologies",
  "specifications",
  "diagrams",
]);

const projectSectionDeepLinkRestoreModeSchema = z.enum(["always", "if-present", "never"]);

const projectSectionPagerActionsSchema = z
  .object({
    allowPrevious: z.boolean().optional(),
    allowNext: z.boolean().optional(),
    allowSelector: z.boolean().optional(),
  })
  .strict();

const projectSectionCapabilitySchema = z
  .object({
    enabled: z.boolean().optional(),
    pagerActions: projectSectionPagerActionsSchema.optional(),
    audioProfile: projectSectionPagerSfxValueSchema.optional(),
    deepLinkRestore: projectSectionDeepLinkRestoreModeSchema.optional(),
  })
  .strict();

const mediaCyclerMediaTypeSchema = z.enum([
  "image",
  "video",
  "pdf",
  "diagram",
  "custom",
  "project",
  "projectPresentation",
  "recognition",
  "recommendation",
  "markdown",
]);

const projectPresentationConfigSchema = z
  .object({
    useSharedOverviewSlide: z.boolean().optional(),
    useSharedDemoSlide: z.boolean().optional(),
    useSharedArchitectureDiagramsSlide: z.boolean().optional(),
    enableWhyThisInterestsSection: z.boolean().optional(),
    demoLayout: z.enum(["default", "podcasts"]).optional(),
    sectionOrder: z.array(projectPresentationSectionKeySchema).min(1).optional(),
    sectionCapabilities: z
      .partialRecord(projectPresentationSectionKeySchema, projectSectionCapabilitySchema)
      .optional(),
    prefetchPlan: z
      .partialRecord(
        projectPresentationSectionKeySchema,
        z.array(mediaCyclerMediaTypeSchema).min(1),
      )
      .optional(),
  })
  .strict();

export const projectEntrySchema = z
  .object({
    name: nonEmptyString,
    showcaseHeading: nonEmptyString.optional(),
    showcaseSubtitle: nonEmptyString.optional(),
    description: nonEmptyString,
    href: nonEmptyString,
    type: z.enum(["personal", "work", "presentation"]),
    presentationOrigin: z.enum(["personal", "work"]).optional(),
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
    presentation: projectPresentationConfigSchema.optional(),
  })
  .superRefine((project, ctx) => {
    if (project.type === "presentation" && !project.presentationOrigin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presentationOrigin"],
        message: "Presentation projects must declare presentationOrigin ('work' or 'personal').",
      });
    }

    if (project.type !== "presentation" && project.presentationOrigin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presentationOrigin"],
        message: "presentationOrigin is only allowed when type is 'presentation'.",
      });
    }

    if (project.type === "presentation" && !project.presentation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presentation"],
        message:
          "Presentation projects must provide a presentation config block for shared orchestration.",
      });
    }

    if (project.type !== "presentation" && project.presentation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presentation"],
        message: "presentation config is only allowed when type is 'presentation'.",
      });
    }

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
