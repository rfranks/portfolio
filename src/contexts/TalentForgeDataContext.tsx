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

type Selector<T> = (store: typeof dataStore) => T;

interface UseTalentForgeSelectorOptions<T> {
  keys?: dataStore.TalentForgeStoreKey[];
  equalityFn?: (a: T, b: T) => boolean;
}

export function useTalentForgeSelector<T>(
  selector: Selector<T>,
  options: UseTalentForgeSelectorOptions<T> = {},
): T {
  const store = useTalentForgeData();
  const { keys, equalityFn = Object.is } = options;

  const selectorRef = React.useRef(selector);
  const equalityRef = React.useRef(equalityFn);

  React.useEffect(() => {
    selectorRef.current = selector;
  }, [selector]);

  React.useEffect(() => {
    equalityRef.current = equalityFn;
  }, [equalityFn]);

  const [value, setValue] = React.useState(() => selector(store));

  React.useEffect(() => {
    const nextValue = selector(store);
    setValue((prev) => (equalityFn(prev, nextValue) ? prev : nextValue));
  }, [store, selector, equalityFn]);

  React.useEffect(() => {
    const checkForUpdates = () => {
      const nextValue = selectorRef.current(store);
      setValue((prev) =>
        equalityRef.current(prev, nextValue) ? prev : nextValue,
      );
    };

    const unsubscribe = store.subscribe((changedKey) => {
      if (!keys || keys.includes(changedKey)) {
        checkForUpdates();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [store, keys]);

  return value;
}

export default TalentForgeDataContext;
