"use client";

export interface ScheduledMessage {
  timestamp: number;
  template: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const scheduledMessages: ScheduledMessage[] = [];

/**
 * Register a follow-up message to be sent after `delayInDays`.
 * For client demo we use setTimeout; hooks provided for future server-side scheduler.
 */
export function scheduleFollowUp(
  template: string,
  delayInDays: number,
  options: { onTrigger?: (msg: ScheduledMessage) => void } = {}
): ScheduledMessage {
  const timestamp = Date.now() + delayInDays * DAY_MS;
  const message: ScheduledMessage = { timestamp, template };
  scheduledMessages.push(message);

  const timeoutMs = timestamp - Date.now();

  // Client-side demo using setTimeout (can be replaced by Web Worker)
  if (typeof window !== "undefined") {
    setTimeout(() => {
      options.onTrigger?.(message);
      // Placeholder for sending notification or UI update
      console.log("Follow-up triggered", message);
    }, timeoutMs);
  }

  // Hook for future server-side scheduler
  void queueOnServer(message);

  return message;
}

/**
 * Return copy of scheduled messages.
 */
export function getScheduledMessages(): ScheduledMessage[] {
  return [...scheduledMessages];
}

/**
 * Placeholder: send scheduled message to server-side scheduler API.
 */
export async function queueOnServer(msg: ScheduledMessage): Promise<void> {
  // Implement API call when backend is available
  return Promise.resolve();
}

