"use client";

import { useEffect } from "react";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";

export default function BlasteroidsPage() {
  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle("Blasteroids");
  }, [setDocumentTitle]);

  return (
    <iframe
      src="https://rfranks.github.io/blasteroids"
      style={{ border: "none", width: "100vw", height: "100vh" }}
      title="Blasteroids"
    />
  );
}
