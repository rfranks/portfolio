import { z } from "zod";
import { absoluteRoutePathSchema, nonEmptyString } from "./primitives";

const appCommandGroupSchema = z.enum(["Apps • Portfolio", "Apps • AI", "Apps • Arcade"]);
const appCoreComponentSchema = z.enum(["arcadeCanvas", "arcadeIframe", "blackjack"]);
const appCoreComponentTargetSchema = z.enum(["warbirds", "zombiefish", "blasteroids", "blackjack"]);

const APP_CORE_COMPONENT_TARGETS_BY_COMPONENT: Record<
  z.infer<typeof appCoreComponentSchema>,
  readonly z.infer<typeof appCoreComponentTargetSchema>[]
> = {
  arcadeCanvas: ["warbirds", "zombiefish"],
  arcadeIframe: ["blasteroids"],
  blackjack: ["blackjack"],
};

const appRouteMetadataSchema = z
  .object({
    route: absoluteRoutePathSchema,
    documentTitle: nonEmptyString,
    metadataTitle: nonEmptyString.optional(),
    metadataDescription: nonEmptyString.optional(),
  })
  .strict();

const appRouteMetadataWithPageMetadataSchema = appRouteMetadataSchema
  .extend({
    metadataTitle: nonEmptyString,
    metadataDescription: nonEmptyString,
  })
  .strict();

const appChromeSchemaShape = {
  appBarSubtitle: nonEmptyString.optional(),
  commandGroup: appCommandGroupSchema.optional(),
  coreComponent: appCoreComponentSchema.optional(),
  coreComponentTarget: appCoreComponentTargetSchema.optional(),
  heroEyebrow: nonEmptyString.optional(),
  interstitialAppName: nonEmptyString.optional(),
  interstitialLogoAlt: nonEmptyString.optional(),
  interstitialLogoSrc: nonEmptyString.optional(),
} as const;

const appRouteSchema = appRouteMetadataSchema.extend(appChromeSchemaShape).strict();
const appRouteSchemaWithPageMetadata = appRouteMetadataWithPageMetadataSchema
  .extend(appChromeSchemaShape)
  .strict();

const siteMetadataSchema = z
  .object({
    route: z.literal("/"),
    description: nonEmptyString,
  })
  .strict();

export const portfolioAppsSchema = z
  .object({
    site: siteMetadataSchema,
    aiShenanigans: appRouteSchema
      .extend({
        route: z.literal("/ai-shenanigans"),
        metadataTitle: nonEmptyString,
        metadataDescription: nonEmptyString,
      })
      .strict(),
    dna: appRouteSchema.extend({ route: z.literal("/dna") }).strict(),
    bookworm: appRouteSchema.extend({ route: z.literal("/bookworm") }).strict(),
    talentforge: appRouteSchema.extend({ route: z.literal("/talentforge") }).strict(),
    rickbert: appRouteSchema
      .extend({
        route: z.literal("/rickbert-studio"),
        metadataTitle: nonEmptyString,
        metadataDescription: nonEmptyString,
      })
      .strict(),
    pathforger: appRouteSchema
      .extend({
        route: z.literal("/pathforger"),
        metadataTitle: nonEmptyString,
        metadataDescription: nonEmptyString,
      })
      .strict(),
    blackjack: appRouteSchema.extend({ route: z.literal("/blackjack") }).strict(),
    warbirds: appRouteSchema.extend({ route: z.literal("/warbirds") }).strict(),
    zombiefish: appRouteSchema.extend({ route: z.literal("/zombiefish") }).strict(),
    blasteroids: appRouteSchema.extend({ route: z.literal("/blasteroids") }).strict(),
    petly: appRouteSchema.extend({ route: z.literal("/petly") }).strict(),
    health: appRouteSchemaWithPageMetadata.extend({ route: z.literal("/health") }).strict(),
    replay: appRouteSchemaWithPageMetadata.extend({ route: z.literal("/replay") }).strict(),
    capabilities: appRouteSchemaWithPageMetadata
      .extend({ route: z.literal("/capabilities") })
      .strict(),
  })
  .strict()
  .superRefine((apps, ctx) => {
    const seenRouteToKey = new Map<string, string>();
    const routePairs: Array<[string, string]> = [
      ["site", apps.site.route],
      ["aiShenanigans", apps.aiShenanigans.route],
      ["dna", apps.dna.route],
      ["bookworm", apps.bookworm.route],
      ["talentforge", apps.talentforge.route],
      ["rickbert", apps.rickbert.route],
      ["pathforger", apps.pathforger.route],
      ["blackjack", apps.blackjack.route],
      ["warbirds", apps.warbirds.route],
      ["zombiefish", apps.zombiefish.route],
      ["blasteroids", apps.blasteroids.route],
      ["petly", apps.petly.route],
      ["health", apps.health.route],
      ["replay", apps.replay.route],
      ["capabilities", apps.capabilities.route],
    ];

    routePairs.forEach(([key, route]) => {
      const existing = seenRouteToKey.get(route);
      if (existing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key, "route"],
          message: `Duplicate portfolio app route '${route}' already declared by '${existing}'.`,
        });
        return;
      }
      seenRouteToKey.set(route, key);
    });

    const appEntries: Array<
      [
        string,
        {
          coreComponent?: z.infer<typeof appCoreComponentSchema>;
          coreComponentTarget?: z.infer<typeof appCoreComponentTargetSchema>;
        },
      ]
    > = [
      ["aiShenanigans", apps.aiShenanigans],
      ["dna", apps.dna],
      ["bookworm", apps.bookworm],
      ["talentforge", apps.talentforge],
      ["rickbert", apps.rickbert],
      ["pathforger", apps.pathforger],
      ["blackjack", apps.blackjack],
      ["warbirds", apps.warbirds],
      ["zombiefish", apps.zombiefish],
      ["blasteroids", apps.blasteroids],
      ["petly", apps.petly],
      ["health", apps.health],
      ["replay", apps.replay],
      ["capabilities", apps.capabilities],
    ];

    appEntries.forEach(([key, appContract]) => {
      const coreComponent = appContract.coreComponent;
      const coreComponentTarget = appContract.coreComponentTarget;

      if (coreComponent && !coreComponentTarget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key, "coreComponentTarget"],
          message:
            "coreComponentTarget is required when coreComponent is provided in portfolio app contracts.",
        });
        return;
      }

      if (!coreComponent && coreComponentTarget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key, "coreComponent"],
          message:
            "coreComponent is required when coreComponentTarget is provided in portfolio app contracts.",
        });
        return;
      }

      if (coreComponent && coreComponentTarget) {
        const allowedTargets = APP_CORE_COMPONENT_TARGETS_BY_COMPONENT[coreComponent];
        if (!allowedTargets.includes(coreComponentTarget)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, "coreComponentTarget"],
            message: `coreComponentTarget '${coreComponentTarget}' is not compatible with coreComponent '${coreComponent}'.`,
          });
        }
      }
    });
  });
