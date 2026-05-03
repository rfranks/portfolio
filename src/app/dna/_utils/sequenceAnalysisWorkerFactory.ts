export function createSequenceAnalysisWorker(): Worker {
  return new Worker(new URL("../_workers/sequenceAnalysis.worker.ts", import.meta.url));
}
