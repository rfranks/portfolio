"use client";

import * as React from "react";
import resumeDataSnapshot, { fetchResumeDataCached, type ResumeData } from "@/consts/resumeData";
import { createLogger } from "@/utils/observability/logger";
import { markEnd, markStart } from "@/utils/observability/perf";

const ResumeDataContext = React.createContext<ResumeData>(resumeDataSnapshot);
const logger = createLogger("resume-data");

type ResumeDataProviderProps = {
  children: React.ReactNode;
};

export default function ResumeDataProvider({ children }: ResumeDataProviderProps) {
  const [resumeData, setResumeData] = React.useState<ResumeData>(resumeDataSnapshot);

  React.useEffect(() => {
    let mounted = true;
    markStart("resume-data-fetch");

    void fetchResumeDataCached()
      .then((nextData) => {
        markEnd("resume-data-fetch");
        if (!mounted) {
          return;
        }
        setResumeData(nextData);
      })
      .catch((error) => {
        markEnd("resume-data-fetch");
        logger.warn("Failed to load resume data at runtime; using snapshot.", {
          error: error instanceof Error ? error.message : "unknown",
        });
        // Keep bundled snapshot if fetch fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return <ResumeDataContext.Provider value={resumeData}>{children}</ResumeDataContext.Provider>;
}

export function useResumeData() {
  return React.useContext(ResumeDataContext);
}
