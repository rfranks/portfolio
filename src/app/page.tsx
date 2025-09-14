import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import Link from "next/link";
import { withBasePath } from "@/utils/basePath";

export const metadata: Metadata = {
  title: "Richard Franks | Résumé",
  description:
    "Résumé of Richard Franks, Principal Full Stack Engineer and AI-driven systems architect.",
  openGraph: {
    title: "Richard Franks | Résumé",
    description:
      "Résumé of Richard Franks, Principal Full Stack Engineer and AI-driven systems architect.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <HomePageClient />
      <Link href={withBasePath("/talentforge")}>TalentForge</Link>
    </>
  );
}

