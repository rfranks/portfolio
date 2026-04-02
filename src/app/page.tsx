import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { summary } from "@/consts/resumeData";

export const metadata: Metadata = {
  title: summary.metadataTitle,
  description: summary.metadataDescription,
  openGraph: {
    title: summary.metadataTitle,
    description: summary.metadataDescription,
    type: "website",
  },
};

export default function Home() {
  return <HomePageClient />;
}
