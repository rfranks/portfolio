import { withBasePath } from "@/utils/basePath";
import { fetchText } from "@/utils/network/httpClient";
import type {
  KnowledgeDocFile,
  PathForgerPipelineProgress,
} from "@/app/pathforger/_types/pipeline";
import { KNOWLEDGE_DOC_FILES } from "@/app/pathforger/_consts/knowledge";
import type { PathForgerKnowledge } from "@/app/pathforger/_types/orchestrationTypes";

type PathForgerKnowledgeCachePayload = {
  version: string;
  knowledge: PathForgerKnowledge;
};

const PATHFORGER_KNOWLEDGE_CACHE_KEY = "pathforger-knowledge-cache-v1";
const PATHFORGER_KNOWLEDGE_CACHE_VERSION = `v2:docs:${KNOWLEDGE_DOC_FILES.join("|")}`;

let knowledgePromise: Promise<PathForgerKnowledge> | null = null;
let knowledgeCache: PathForgerKnowledge | null = null;

function isPathForgerKnowledge(value: unknown): value is PathForgerKnowledge {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PathForgerKnowledge>;
  if (typeof candidate.mainPrompt !== "string") {
    return false;
  }
  if (!candidate.docs || typeof candidate.docs !== "object") {
    return false;
  }

  for (const docFile of KNOWLEDGE_DOC_FILES) {
    if (typeof candidate.docs[docFile] !== "string") {
      return false;
    }
  }

  return true;
}

function readKnowledgeFromSessionCache(): PathForgerKnowledge | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PathForgerKnowledgeCachePayload;
    if (
      !parsed ||
      parsed.version !== PATHFORGER_KNOWLEDGE_CACHE_VERSION ||
      !isPathForgerKnowledge(parsed.knowledge)
    ) {
      window.sessionStorage.removeItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
      return null;
    }

    return parsed.knowledge;
  } catch {
    return null;
  }
}

function hasKnowledgeSessionCache(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.sessionStorage.getItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
    return Boolean(raw);
  } catch {
    return false;
  }
}

function writeKnowledgeToSessionCache(knowledge: PathForgerKnowledge): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: PathForgerKnowledgeCachePayload = {
      version: PATHFORGER_KNOWLEDGE_CACHE_VERSION,
      knowledge,
    };
    window.sessionStorage.setItem(PATHFORGER_KNOWLEDGE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

async function readStaticText(path: string): Promise<string> {
  const { data } = await fetchText(withBasePath(path), {
    method: "GET",
    cache: "force-cache",
  });
  return data.trim();
}

async function loadPathForgerKnowledge(): Promise<PathForgerKnowledge> {
  if (knowledgeCache) {
    return knowledgeCache;
  }

  if (!knowledgePromise) {
    knowledgePromise = (async () => {
      const cachedKnowledge = readKnowledgeFromSessionCache();
      if (cachedKnowledge) {
        knowledgeCache = cachedKnowledge;
        return cachedKnowledge;
      }

      const [mainPrompt, ...docContents] = await Promise.all([
        readStaticText("/apps/pathforger/MAIN_PROMPT.txt"),
        ...KNOWLEDGE_DOC_FILES.map((file) =>
          readStaticText(`/apps/pathforger/knowledge-files/${file}`),
        ),
      ]);

      const docs = KNOWLEDGE_DOC_FILES.reduce<Record<KnowledgeDocFile, string>>(
        (acc, file, index) => {
          acc[file] = docContents[index];
          return acc;
        },
        {} as Record<KnowledgeDocFile, string>,
      );

      const knowledge: PathForgerKnowledge = {
        mainPrompt,
        docs,
      };

      knowledgeCache = knowledge;
      writeKnowledgeToSessionCache(knowledge);

      return knowledge;
    })();
  }

  return knowledgePromise;
}

export async function loadPathForgerKnowledgeForStage(
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<PathForgerKnowledge> {
  const shouldAnnounceLoading = !knowledgeCache && !knowledgePromise && !hasKnowledgeSessionCache();
  if (shouldAnnounceLoading) {
    onProgress?.({
      stage: "loadingKnowledge",
      message: "Loading PathForger knowledge files...",
    });
  }

  return loadPathForgerKnowledge();
}
