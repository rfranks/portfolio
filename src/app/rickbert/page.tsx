import type { Metadata } from "next";
import RickbertPageClient from "./RickbertPageClient";
import "./page.css";
import { portfolioApps } from "@/personal/data/resumeData";

export const metadata: Metadata = {
  title: portfolioApps.rickbert.metadataTitle,
  description: portfolioApps.rickbert.metadataDescription,
};

export default function RickbertPage() {
  return <RickbertPageClient />;
}
