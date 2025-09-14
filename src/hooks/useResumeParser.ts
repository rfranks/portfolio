import { useCallback, useState } from "react";

import { pdfToMarkdown } from "@/utils/talentforge/pdfParser";

export default function useResumeParser() {
  const [resume, setResume] = useState("");

  const parseResume = useCallback(async (input: File | string) => {
    if (typeof input === "string") {
      setResume(input);
      return input;
    }
    const text = await pdfToMarkdown(input);
    setResume(text);
    return text;
  }, []);

  return { resume, parseResume };
}

