import type { ResumeData } from "@/consts/resumeData";
import type { AIShenaniganProps, AIShenaniganType } from "./aiShenanigan";

export type AIShenaniganDataItem = ResumeData["aiShenanigans"]["items"][number] & {
  type?: AIShenaniganType | string;
} & Record<string, unknown>;

export type AIShenaniganFilterCategory = "medium" | "style" | "series";

export type AIShenaniganFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type AIShenaniganFilterOptionByCategory = Record<
  AIShenaniganFilterCategory,
  AIShenaniganFilterOption[]
>;

export type AIShenaniganFilterSelection = {
  medium?: string;
  style?: string;
  series?: string;
};

export type AIShenaniganPageItem = {
  slug: string;
  title: string;
  blurb: string;
  shortText?: string;
  previewImage: string;
  mediumTags: string[];
  styleTags: string[];
  seriesTag: string;
  props: AIShenaniganProps;
};

export type AIShenaniganPagerItem = Pick<
  AIShenaniganPageItem,
  "slug" | "title" | "blurb" | "shortText" | "previewImage"
>;
