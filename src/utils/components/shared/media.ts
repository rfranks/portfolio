import type * as React from "react";

export const safeImport = (loadPromise: Promise<unknown>) => {
  void loadPromise.catch(() => undefined);
};

export const createMediaActivateKeyDownHandler =
  (onMediaActivate?: () => void) => (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onMediaActivate) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMediaActivate();
    }
  };
