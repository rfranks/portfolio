"use client";

import * as React from "react";
import resumeDataSnapshot, {
  fetchResumeDataCached,
  type ResumeData,
} from "@/consts/resumeData";

const ResumeDataContext = React.createContext<ResumeData>(resumeDataSnapshot);

type ResumeDataProviderProps = {
  children: React.ReactNode;
};

export default function ResumeDataProvider({
  children,
}: ResumeDataProviderProps) {
  const [resumeData, setResumeData] = React.useState<ResumeData>(resumeDataSnapshot);

  React.useEffect(() => {
    let mounted = true;

    void fetchResumeDataCached()
      .then((nextData) => {
        if (!mounted) {
          return;
        }
        setResumeData(nextData);
      })
      .catch(() => {
        // Keep bundled snapshot if fetch fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ResumeDataContext.Provider value={resumeData}>
      {children}
    </ResumeDataContext.Provider>
  );
}

export function useResumeData() {
  return React.useContext(ResumeDataContext);
}
