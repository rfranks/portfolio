"use client";

import { useEffect, useState } from "react";

export default function useOrigin(): string {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  if (!mounted) {
    return "";
  }

  return origin;
}
