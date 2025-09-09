import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage external accounts",
};

export default function Page() {
  return <SettingsClient />;
}
