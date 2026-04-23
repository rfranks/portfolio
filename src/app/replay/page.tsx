import type { Metadata } from "next";
import SessionReplayPageClient from "./SessionReplayPageClient";

export const metadata: Metadata = {
  title: "Session Replay Lite Viewer",
  description:
    "Load and inspect session replay-lite JSON exports with timeline scrubbing and event filters.",
};

export default function SessionReplayPage() {
  return <SessionReplayPageClient />;
}
