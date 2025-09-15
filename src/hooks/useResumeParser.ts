import { useCallback, useState } from "react";

import { fileToText } from "@/utils/talentforge/resumeIngest";

export default function useResumeParser() {
  const [resume, setResume] = useState("");

  const parseResume = useCallback(async (input: File | string) => {
    if (typeof input === "string") {
      setResume(input);
      return input;
    }
    const text = await fileToText(input);
    setResume(text);
    return text;
  }, []);

  return { resume, parseResume };
}

