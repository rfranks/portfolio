import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

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
  return <HomePageClient />;
}

