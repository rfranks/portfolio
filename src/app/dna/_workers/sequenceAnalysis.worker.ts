/// <reference lib="webworker" />

import {
  buildSequenceAnalysisOverlayData,
  runSelectedSequenceAnalysisRecipes,
  runSequenceAnalysisRecipe,
  type SequenceAnalysisWorkerRequest,
  type SequenceAnalysisWorkerResponse,
} from "../_utils/sequenceUtils";

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

const toWorkerErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return "Unknown worker error while running DNA analysis.";
};

workerScope.onmessage = (event: MessageEvent<SequenceAnalysisWorkerRequest>) => {
  const request = event.data;
  if (!request) {
    return;
  }

  try {
    if (request.action === "run-recipe") {
      const result = runSequenceAnalysisRecipe(request.payload.sequence, request.payload.config);
      const response: SequenceAnalysisWorkerResponse = {
        requestId: request.requestId,
        action: request.action,
        ok: true,
        result,
      };
      workerScope.postMessage(response);
      return;
    }

    if (request.action === "run-batch") {
      const result = runSelectedSequenceAnalysisRecipes(
        request.payload.sequence,
        request.payload.configs,
      );
      const response: SequenceAnalysisWorkerResponse = {
        requestId: request.requestId,
        action: request.action,
        ok: true,
        result,
      };
      workerScope.postMessage(response);
      return;
    }

    const result = buildSequenceAnalysisOverlayData(
      request.payload.sequence,
      request.payload.config,
    );
    const response: SequenceAnalysisWorkerResponse = {
      requestId: request.requestId,
      action: request.action,
      ok: true,
      result,
    };
    workerScope.postMessage(response);
  } catch (error) {
    const response: SequenceAnalysisWorkerResponse = {
      requestId: request.requestId,
      action: request.action,
      ok: false,
      error: toWorkerErrorMessage(error),
    };
    workerScope.postMessage(response);
  }
};
