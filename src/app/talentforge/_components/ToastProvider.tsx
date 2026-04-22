"use client";

import { Alert, AlertColor, Button, Snackbar, type SnackbarCloseReason } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ToastOptions {
  message: string;
  severity?: AlertColor;
  actionLabel?: string;
  onAction?: () => void;
  autoHideDuration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleClose = useCallback(
    (_: unknown, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      hideToast();
    },
    [hideToast],
  );

  const handleAction = useCallback(() => {
    const action = toast?.onAction;
    hideToast();
    action?.();
  }, [hideToast, toast]);

  const contextValue = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Snackbar
        key={toast?.id ?? undefined}
        open={Boolean(toast)}
        onClose={handleClose}
        autoHideDuration={toast?.autoHideDuration ?? 6000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          data-testid="toast-alert"
          severity={toast?.severity ?? "error"}
          onClose={hideToast}
          action={
            toast?.onAction ? (
              <Button color="inherit" size="small" onClick={handleAction}>
                {toast.actionLabel ?? "Retry"}
              </Button>
            ) : undefined
          }
          sx={{ alignItems: "center" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
