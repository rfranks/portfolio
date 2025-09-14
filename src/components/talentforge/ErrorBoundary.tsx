'use client';

import { Component, ReactNode, useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

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
    console.error('ErrorBoundary caught an error', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <Box role="alert" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Something went wrong.
          </Typography>
          <Button variant="contained" onClick={this.reset}>
            Try again
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

