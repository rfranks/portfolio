import type { Metadata } from "next";
import HealthDashboardPageClient from "./HealthDashboardPageClient";

export const metadata: Metadata = {
  title: "Portfolio Health Dashboard",
  description:
    "Bundle budget, test and accessibility health, and resume schema validation snapshots.",
};

export default function HealthPage() {
  return <HealthDashboardPageClient />;
}
