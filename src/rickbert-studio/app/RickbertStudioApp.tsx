"use client";

import { useEffect } from "react";
import { RickbertStudioShell } from "@/rickbert-studio/studio/RickbertStudioShell";
import { useRickbertStudioStore } from "@/rickbert-studio/store";

export default function RickbertStudioApp() {
  const parse = useRickbertStudioStore((state) => state.parse);
  const validate = useRickbertStudioStore((state) => state.validate);
  const render = useRickbertStudioStore((state) => state.render);

  useEffect(() => {
    parse();
    validate();
    render();
  }, [parse, render, validate]);

  return <RickbertStudioShell />;
}
