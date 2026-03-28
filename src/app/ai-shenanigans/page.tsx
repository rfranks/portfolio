import type { Metadata } from "next";
import AIShenanigansPageClient from "./AIShenanigansPageClient";

export const metadata: Metadata = {
  title: "AI Shenanigans",
  description: "Stylized AI experiments blending source photos, caricature renders, and optional motion passes.",
};

export default function AIShenanigansPage() {
  return <AIShenanigansPageClient />;
}
