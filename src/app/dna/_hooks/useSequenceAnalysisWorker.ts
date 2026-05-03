import { useCallback, useEffect, useRef, useState } from "react";

import {
  DNA_SEQUENCE_ANALYSIS_WORKER_TIMEOUT_MS,
  type SequenceAnalysisWorkerRequest,
  type SequenceAnalysisWorkerResponse,
} from "../_utils/sequenceUtils";

type PendingWorkerRequest = {
  timeoutId: number;
  resolve: (response: SequenceAnalysisWorkerResponse) => void;
  reject: (error: Error) => void;
};

type SequenceAnalysisWorkerFactoryModule = {
  createSequenceAnalysisWorker: () => Worker;
};

const WORKER_ERROR_MESSAGE = "DNA analysis worker encountered an unexpected error.";
const WORKER_SHUTDOWN_MESSAGE = "DNA analysis worker shut down before completing the request.";

export function useSequenceAnalysisWorker() {
  const [workerEnabled, setWorkerEnabled] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingWorkerRequestsRef = useRef<Map<string, PendingWorkerRequest>>(new Map());

  const flushPendingWorkerRequests = useCallback((errorMessage: string) => {
    pendingWorkerRequestsRef.current.forEach((pendingRequest) => {
      window.clearTimeout(pendingRequest.timeoutId);
      pendingRequest.reject(new Error(errorMessage));
    });
    pendingWorkerRequestsRef.current.clear();
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof Worker === "undefined" ||
      process.env.NODE_ENV === "test"
    ) {
      setWorkerEnabled(false);
      return;
    }

    let isActive = true;
    let sequenceAnalysisWorker: Worker | null = null;

    const setupWorker = async () => {
      try {
        const workerFactoryModule =
          (await import("../_utils/sequenceAnalysisWorkerFactory")) as SequenceAnalysisWorkerFactoryModule;
        if (!isActive) {
          return;
        }

        sequenceAnalysisWorker = workerFactoryModule.createSequenceAnalysisWorker();
        workerRef.current = sequenceAnalysisWorker;
        setWorkerEnabled(true);

        sequenceAnalysisWorker.onmessage = (
          event: MessageEvent<SequenceAnalysisWorkerResponse>,
        ) => {
          const response = event.data;
          const pendingRequest = pendingWorkerRequestsRef.current.get(response.requestId);
          if (!pendingRequest) {
            return;
          }

          window.clearTimeout(pendingRequest.timeoutId);
          pendingWorkerRequestsRef.current.delete(response.requestId);
          pendingRequest.resolve(response);
        };

        sequenceAnalysisWorker.onerror = () => {
          setWorkerEnabled(false);
          flushPendingWorkerRequests(WORKER_ERROR_MESSAGE);
        };
      } catch {
        if (!isActive) {
          return;
        }
        setWorkerEnabled(false);
        flushPendingWorkerRequests(WORKER_ERROR_MESSAGE);
      }
    };

    void setupWorker();

    return () => {
      isActive = false;
      setWorkerEnabled(false);
      flushPendingWorkerRequests(WORKER_SHUTDOWN_MESSAGE);
      if (sequenceAnalysisWorker) {
        sequenceAnalysisWorker.terminate();
      }
      if (workerRef.current === sequenceAnalysisWorker) {
        workerRef.current = null;
      }
    };
  }, [flushPendingWorkerRequests]);

  const runWorkerRequest = useCallback(
    async (request: SequenceAnalysisWorkerRequest): Promise<SequenceAnalysisWorkerResponse> => {
      const sequenceAnalysisWorker = workerRef.current;
      if (!sequenceAnalysisWorker) {
        throw new Error("DNA analysis worker is not available in this environment.");
      }

      return await new Promise<SequenceAnalysisWorkerResponse>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          pendingWorkerRequestsRef.current.delete(request.requestId);
          reject(
            new Error(
              `DNA analysis worker timed out after ${Math.round(
                DNA_SEQUENCE_ANALYSIS_WORKER_TIMEOUT_MS / 1000,
              )} seconds.`,
            ),
          );
        }, DNA_SEQUENCE_ANALYSIS_WORKER_TIMEOUT_MS);

        pendingWorkerRequestsRef.current.set(request.requestId, {
          timeoutId,
          resolve,
          reject,
        });

        sequenceAnalysisWorker.postMessage(request);
      });
    },
    [],
  );

  return {
    workerEnabled,
    runWorkerRequest,
  };
}
