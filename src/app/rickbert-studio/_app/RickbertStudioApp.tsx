"use client";

import { useEffect } from "react";
import { RickbertStudioShell } from "@/app/rickbert-studio/_components/studio/RickbertStudioShell";
import { useRickbertStudioStore } from "@/app/rickbert-studio/_store";

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
