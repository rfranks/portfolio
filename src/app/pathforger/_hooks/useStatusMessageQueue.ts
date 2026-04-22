import * as React from "react";

export function useStatusMessageQueue(minDisplayMs: number): {
  statusMessage: string;
  enqueueStatusMessage: (message: string) => void;
  clearStatusMessages: () => void;
} {
  const [statusMessage, setStatusMessage] = React.useState("");
  const statusMessageQueueRef = React.useRef<string[]>([]);
  const currentStatusMessageRef = React.useRef("");
  const currentStatusMessageShownAtRef = React.useRef(0);
  const statusMessageTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const processStatusQueueRef = React.useRef<() => void>(() => {});

  const clearStatusMessageTimer = React.useCallback(() => {
    if (statusMessageTimerRef.current !== null) {
      clearTimeout(statusMessageTimerRef.current);
      statusMessageTimerRef.current = null;
    }
  }, []);

  const scheduleStatusQueueDrain = React.useCallback((delayMs: number) => {
    if (statusMessageTimerRef.current !== null) {
      return;
    }

    statusMessageTimerRef.current = setTimeout(
      () => {
        statusMessageTimerRef.current = null;
        processStatusQueueRef.current();
      },
      Math.max(0, delayMs),
    );
  }, []);

  React.useEffect(() => {
    processStatusQueueRef.current = () => {
      const currentMessage = currentStatusMessageRef.current.trim();
      const queue = statusMessageQueueRef.current;

      if (currentMessage.length === 0) {
        const nextMessage = queue.shift();
        if (!nextMessage) {
          return;
        }

        currentStatusMessageRef.current = nextMessage;
        currentStatusMessageShownAtRef.current = Date.now();
        setStatusMessage(nextMessage);

        if (queue.length > 0) {
          scheduleStatusQueueDrain(minDisplayMs);
        }
        return;
      }

      const elapsed = Date.now() - currentStatusMessageShownAtRef.current;
      if (elapsed < minDisplayMs) {
        scheduleStatusQueueDrain(minDisplayMs - elapsed);
        return;
      }

      const nextMessage = queue.shift();
      if (!nextMessage) {
        return;
      }

      currentStatusMessageRef.current = nextMessage;
      currentStatusMessageShownAtRef.current = Date.now();
      setStatusMessage(nextMessage);

      if (queue.length > 0) {
        scheduleStatusQueueDrain(minDisplayMs);
      }
    };
  }, [minDisplayMs, scheduleStatusQueueDrain]);

  const enqueueStatusMessage = React.useCallback(
    (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message) {
        return;
      }

      const current = currentStatusMessageRef.current.trim();
      if (!current) {
        clearStatusMessageTimer();
        currentStatusMessageRef.current = message;
        currentStatusMessageShownAtRef.current = Date.now();
        setStatusMessage(message);
        return;
      }

      const queue = statusMessageQueueRef.current;
      const lastQueued = queue.length > 0 ? queue[queue.length - 1] : "";
      if (message !== current && message !== lastQueued) {
        queue.push(message);
      }

      const elapsed = Date.now() - currentStatusMessageShownAtRef.current;
      if (elapsed >= minDisplayMs) {
        processStatusQueueRef.current();
        return;
      }

      scheduleStatusQueueDrain(minDisplayMs - elapsed);
    },
    [clearStatusMessageTimer, minDisplayMs, scheduleStatusQueueDrain],
  );

  const clearStatusMessages = React.useCallback(() => {
    statusMessageQueueRef.current = [];
    currentStatusMessageRef.current = "";
    currentStatusMessageShownAtRef.current = 0;
    clearStatusMessageTimer();
    setStatusMessage("");
  }, [clearStatusMessageTimer]);

  React.useEffect(
    () => () => {
      clearStatusMessageTimer();
    },
    [clearStatusMessageTimer],
  );

  return {
    statusMessage,
    enqueueStatusMessage,
    clearStatusMessages,
  };
}
