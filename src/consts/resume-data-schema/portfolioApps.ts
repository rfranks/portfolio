import { z } from "zod";
import { absoluteRoutePathSchema, nonEmptyString } from "./primitives";

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
  heroEyebrow: nonEmptyString.optional(),
  interstitialAppName: nonEmptyString.optional(),
  interstitialLogoAlt: nonEmptyString.optional(),
  interstitialLogoSrc: nonEmptyString.optional(),
} as const;

const appRouteSchema = appRouteMetadataSchema.extend(appChromeSchemaShape).strict();

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
    health: appRouteMetadataWithPageMetadataSchema.extend({ route: z.literal("/health") }).strict(),
    replay: appRouteMetadataWithPageMetadataSchema.extend({ route: z.literal("/replay") }).strict(),
    capabilities: appRouteMetadataWithPageMetadataSchema
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
  });
