'use client';

import React from 'react';
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
  const context = React.useContext(TalentForgeDataContext);
  if (!context) {
    throw new Error('useTalentForgeData must be used within a TalentForgeDataProvider');
  }
  return context;
}

export function useTalentForgeSelector<T>(
  selector: (store: typeof dataStore) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
) {
  const store = useTalentForgeData();
  const selectorRef = React.useRef(selector);
  selectorRef.current = selector;
  const equalityRef = React.useRef(isEqual);
  equalityRef.current = isEqual;
  const lastValueRef = React.useRef<T>();

  const getSnapshot = React.useCallback(() => {
    const next = selectorRef.current(store);
    lastValueRef.current = next;
    return next;
  }, [store]);

  return React.useSyncExternalStore(
    (onStoreChange) => {
      const handleChange = () => {
        const next = selectorRef.current(store);
        const previous = lastValueRef.current;
        if (previous === undefined || !equalityRef.current(previous, next)) {
          lastValueRef.current = next;
          onStoreChange();
        }
      };
      const unsubscribe = store.subscribe(handleChange);
      return () => {
        unsubscribe();
      };
    },
    getSnapshot,
    getSnapshot,
  );
}

export default TalentForgeDataContext;
