"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useToast } from "@/app/talentforge/_components/ToastProvider";
import {
  describeAskError,
  type AskErrorInfo,
} from "@/app/talentforge/_utils/errors";

interface NotifyOptions {
  getToastMessage?: (message: string) => string;
  retry?: () => void;
  retryLabel?: string;
}

type ErrorLike = unknown | AskErrorInfo;

const resolveErrorInfo = (value: ErrorLike): AskErrorInfo => {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    "isKeyIssue" in value
  ) {
    const info = value as AskErrorInfo;
    return { message: info.message, isKeyIssue: info.isKeyIssue };
  }
  return describeAskError(value);
};

export default function useAIErrorHandler() {
  const { showToast } = useToast();
  const router = useRouter();

  return useCallback(
    (error: ErrorLike, options?: NotifyOptions): AskErrorInfo => {
      const info = resolveErrorInfo(error);
      const toastMessage = options?.getToastMessage
        ? options.getToastMessage(info.message)
        : info.message;

      const action = info.isKeyIssue
        ? () => router.push("/talentforge/settings")
        : options?.retry;

      const actionLabel = info.isKeyIssue
        ? "Open settings"
        : options?.retry
        ? options.retryLabel ?? "Retry"
        : undefined;

      if (toastMessage) {
        showToast({
          message: toastMessage,
          severity: "error",
          actionLabel,
          onAction: action,
        });
      }

      return info;
    },
    [router, showToast],
  );
}
