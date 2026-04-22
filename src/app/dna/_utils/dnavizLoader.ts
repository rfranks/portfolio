import { useEffect, useState } from "react";

export type DnaVizMetricKey = "gates" | "qi" | "randic" | "squiggle";
export type DnaVizMetricFn = (sequence: string) => [number[], number[]];

type DnaVizModule = typeof import("dnaviz");

let dnavizPromise: Promise<DnaVizModule> | null = null;

async function loadDnaVizModule(): Promise<DnaVizModule> {
  if (!dnavizPromise) {
    dnavizPromise = import("dnaviz");
  }
  return dnavizPromise;
}

export async function loadDnaVizMetric(metric: DnaVizMetricKey): Promise<DnaVizMetricFn> {
  const dnavizModule = await loadDnaVizModule();
  const resolver = dnavizModule[metric];
  if (typeof resolver !== "function") {
    throw new Error(`dnaviz metric "${metric}" is not available.`);
  }
  return resolver as DnaVizMetricFn;
}

export function useDnaVizMetric(metric: DnaVizMetricKey): DnaVizMetricFn | null {
  const [resolver, setResolver] = useState<DnaVizMetricFn | null>(null);

  useEffect(() => {
    let mounted = true;

    void loadDnaVizMetric(metric)
      .then((loadedResolver) => {
        if (!mounted) {
          return;
        }
        setResolver(() => loadedResolver);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setResolver(null);
      });

    return () => {
      mounted = false;
    };
  }, [metric]);

  return resolver;
}
