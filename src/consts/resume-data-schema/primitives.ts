import { z } from "zod";

export const nonEmptyString = z.string().trim().min(1);

export const absoluteRoutePathSchema = nonEmptyString.refine((value) => value.startsWith("/"), {
  message: "Route paths must start with '/'.",
});

export const navIconTypeSchema = z.enum(["material", "emoji", "image"]);
