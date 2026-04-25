import type { ResumeData } from "@/consts/resumeData";
import type { AIShenaniganProps, AIShenaniganType } from "./aiShenanigan";

export type AIShenaniganDataItem = ResumeData["aiShenanigans"]["items"][number] & {
  type?: AIShenaniganType | string;
} & Record<string, unknown>;

export type AIShenaniganPageItem = {
  slug: string;
  title: string;
  blurb: string;
  shortText?: string;
  previewImage: string;
  props: AIShenaniganProps;
};

export type AIShenaniganPagerItem = Pick<
  AIShenaniganPageItem,
  "slug" | "title" | "blurb" | "shortText" | "previewImage"
>;
