'use client';

import React, {
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from 'react';
import * as dataStore from '@/utils/talentforge/dataStore';

const TalentForgeDataContext = React.createContext<typeof dataStore | undefined>(undefined);

export function TalentForgeDataProvider({ children }: { children: React.ReactNode }) {
  return (
    <TalentForgeDataContext.Provider value={dataStore}>
      {children}
    </TalentForgeDataContext.Provider>
  );
}

export function useTalentForgeData() {
  const context = useContext(TalentForgeDataContext);
  if (!context) {
    throw new Error('useTalentForgeData must be used within a TalentForgeDataProvider');
  }
  return context;
}

type Selector<T> = (store: typeof dataStore) => T;

export function useTalentForgeSelector<T>(selector: Selector<T>): T {
  const store = useTalentForgeData();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = useCallback(() => selectorRef.current(store), [store]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(() => onStoreChange()),
    [store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default TalentForgeDataContext;
