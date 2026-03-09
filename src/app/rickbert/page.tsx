import type { Metadata } from "next";
import RickbertPageClient from "./RickbertPageClient";
import "./page.css";

export const metadata: Metadata = {
  title: "Rickbert Studio",
  description: "Structured comic strip generation studio for the RICKBERT series.",
};

export default function RickbertPage() {
  return <RickbertPageClient />;
}
