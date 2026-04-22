"use client";

import { Component, ReactNode, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { usePathname } from "next/navigation";

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class InnerErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <Box role="alert" sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please try again. If the problem persists, reload the page.
          </Typography>
          <Button variant="contained" onClick={this.reset} sx={{ mr: 1 }}>
            Try again
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: BoundaryProps) {
  const pathname = usePathname();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [pathname]);

  return <InnerErrorBoundary key={key}>{children}</InnerErrorBoundary>;
}
