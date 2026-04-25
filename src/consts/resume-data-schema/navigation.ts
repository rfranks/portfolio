import { z } from "zod";
import { navIconTypeSchema, nonEmptyString } from "./primitives";

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

export const navigationSchema = z
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
