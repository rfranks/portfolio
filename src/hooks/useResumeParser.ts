import { useCallback, useState } from "react";

import {
  fileToText,
  createPastedResumeMetadata,
  type ResumeImportMetadata,
  type ResumeTextResult,
} from "@/app/talentforge/_utils/resumeIngest";

export default function useResumeParser() {
  const [resume, setResume] = useState("");
  const [metadata, setMetadata] = useState<ResumeImportMetadata | null>(null);

  const parseResume = useCallback(async (input: File | string): Promise<ResumeTextResult> => {
    if (typeof input === "string") {
      const metadataForPaste = createPastedResumeMetadata();
      setResume(input);
      setMetadata(metadataForPaste);
      return { text: input, metadata: metadataForPaste };
    }
    const result = await fileToText(input);
    setResume(result.text);
    setMetadata(result.metadata);
    return result;
  }, []);

  return { resume, metadata, parseResume };
}
