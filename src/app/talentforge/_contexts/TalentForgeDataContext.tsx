"use client";

import React from "react";
import * as dataStore from "@/app/talentforge/_utils/dataStore";

const TalentForgeDataContext = React.createContext<typeof dataStore | undefined>(undefined);

export function TalentForgeDataProvider({ children }: { children: React.ReactNode }) {
  return (
    <TalentForgeDataContext.Provider value={dataStore}>{children}</TalentForgeDataContext.Provider>
  );
}

export function useTalentForgeData() {
  const context = React.useContext(TalentForgeDataContext);
  if (!context) {
    throw new Error("useTalentForgeData must be used within a TalentForgeDataProvider");
  }
  return context;
}

export default TalentForgeDataContext;
