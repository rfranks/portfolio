import { ProjectData } from "@/components/showcase/ProjectPresentation";

export const projectData: ProjectData = {
  project: "Patient List Podcasts (Gemini TTS)",
  description:
    "The Next.js PromptJob page receives a chatUri prop that points to the Flask aichat route /v1/chat_patient. When a physician submits a question, the page kicks off an agentic PromptJob. The aichat service (via LangChain) calls Azure Functions to fetch each patient's last 12 hours of data from Cosmos DB, plans a podcast script per patient, then uses Gemini for text-to-speech to synthesize audio. The Functions layer stores podcast metadata in Cosmos DB and the audio in Blob Storage. The page renders a fully interactive list grouped by patient—showing status/progress, transcript excerpts, and an HTML5 audio player—refreshing as items complete until the job is done.",
  demoVideoUrl: "/demovideos/physician_last12hours_podcast.mov",
  specifications: {
    "UI contract": [
      "The page accepts chatUri (points to Flask aichat /v1/chat_patient) and an optional time window defaulting to last 12 hours; it POSTs the physician’s prompt to start a PromptJob and receives a jobId.",
    ],
    "Agentic pipeline": [
      "The aichat Flask service (LangChain) orchestrates tools that call TypeScript Azure Functions to (1) fetch per-patient events for the last 12 hours, (2) draft podcast scripts, (3) synthesize audio via Gemini TTS, and (4) persist results.",
    ],
    "Data model": [
      "Cosmos DB containers for Patients, Events (labs, vitals, notes), PromptJobs (status, progress), and PodcastItems (patientId, timestamps, outline/script, audioUrl, transcript, status).",
    ],
    Storage: [
      "Podcast audio persisted as MP3/OGG in Azure Blob Storage.",
      "Blob URLs or SAS tokens returned to the UI through PodcastItems.",
    ],
    "Access pattern": [
      "UI polls PromptJobs and PodcastItems endpoints (or listens to optional push) to incrementally render cards per patient as audio becomes available.",
    ],
    Security: [
      "aichat and Azure Functions secured via AAD or function keys; UI includes bearer/token when invoking chatUri and Functions; PHI is not logged; only minimum patient fields are projected to UI.",
    ],
    Observability: [
      "jobId/requestId propagated across aichat, Functions, and storage; structured logs and metrics emitted on each stage (fetch, script, TTS, persist).",
    ],
    Resiliency: [
      "Idempotent PromptJob creation keyed by (prompt, timeWindow); per-patient steps retried independently; partial completions surfaced live to the UI.",
    ],
    Performance: [
      "Server-side time filtering (last 12h) and pagination; audio generation parallelized per patient with bounded concurrency; blobs served with CDN/SAS    ; UI uses built-in Next.js fetch with incremental re-fetch logic.",
    ],
  },
  technologiesUsed: [
    {
      name: "Next.js (React + TypeScript)",
      url: "[https://nextjs.org](https://nextjs.org)",
    },
    { name: "React", url: "[https://react.dev](https://react.dev)" },
    {
      name: "TypeScript",
      url: "[https://www.typescriptlang.org](https://www.typescriptlang.org)",
    },
    {
      name: "Native Fetch API (Next.js App Router / Route Handlers)",
      url: "[https://developer.mozilla.org/docs/Web/API/Fetch_API](https://developer.mozilla.org/docs/Web/API/Fetch_API)",
    },
    {
      name: "Flask (aichat service)",
      url: "[https://flask.palletsprojects.com](https://flask.palletsprojects.com)",
    },
    {
      name: "LangChain (agent + tools)",
      url: "[https://python.langchain.com](https://python.langchain.com)",
    },
    {
      name: "Google Gemini (Generative AI TTS)",
      url: "[https://ai.google.dev](https://ai.google.dev)",
    },
    {
      name: "Azure Functions (TypeScript)",
      url: "[https://learn.microsoft.com/azure/azure-functions/](https://learn.microsoft.com/azure/azure-functions/)",
    },
    {
      name: "Azure Cosmos DB (Core/SQL)",
      url: "[https://learn.microsoft.com/azure/cosmos-db/](https://learn.microsoft.com/azure/cosmos-db/)",
    },
    {
      name: "Azure Blob Storage",
      url: "[https://learn.microsoft.com/azure/storage/blobs/](https://learn.microsoft.com/azure/storage/blobs/)",
    },
  ],
  blockDiagram:
    "flowchart TB\n  subgraph UI[Next.js PromptJob Page]\n    Q[Physician Question]\n    L[List: Patient Podcasts]\n    P[HTML5 Audio Player]\n    F[Filters: last 12h]\n    S[Status/Progress Chips]\n  end\n\n  subgraph AICHAT[Python Flask aichat]\n    R[v1/chat_patient]\n    AG[LangChain Agent]\n    T1[Tool:getPatientEvents for 12h]\n    T2[Tool:planAndDraftScript]\n    T3[Tool:geminiTTS]\n    T4[Tool:savePodcastItem]\n  end\n\n  subgraph AFNS[Azure Functions-TypeScript]\n    FN1[/GET Patients/]\n    FN2[/GET Events?since=12h/]\n    FN3[/POST PromptJobs/]\n    FN4[/GET PromptJobs/:id/]\n    FN5[/PUT PodcastItems/]\n  end\n\n  subgraph DATA[Azure Resources]\n    COSMOS[(Cosmos DB)]\n    BLOB[[Blob Storage: audio.mp3]]\n  end\n\n  Q -->|POST prompt, window:12h via chatUri| R\n  R --> AG\n  AG -->|invoke| T1 --> FN2 --> COSMOS\n  AG -->|invoke| T2\n  AG -->|invoke| T3 --> BLOB\n  AG -->|invoke| T4 --> FN5 --> COSMOS\n  R -->|create job| FN3 --> COSMOS\n  UI <--> |poll| FN4\n  UI --> |fetch list| FN5\n  COSMOS -->|podcast metadata| UI\n  BLOB -->|audioUrl - SAS | UI\n  UI -.-> L\n  UI -.-> P\n  UI -.-> S\n  UI -.-> F\n",
  componentDiagram:
    "flowchart LR\n  subgraph Page[PromptJobPage.tsx]\n    HOOK0[useInit chatUri, window=12h]\n    HOOK1[usePromptJob-chatUri]\n    HOOK2[usePromptJobStatus-jobId]\n    HOOK3[usePatientPodcasts-window=12h]\n    HOOK4[useAudioPlayer]\n    HOOK5[useFilters]\n    BAR[FiltersBar]\n    LIST[PodcastList]\n    CARD[PatientPodcastCard]\n    PLAYER[PodcastPlayer]\n    EMPTY[EmptyState]\n  end\n\n  HOOK0 --> HOOK1\n  HOOK1 --> HOOK2\n  HOOK2 --> HOOK3\n  HOOK5 --> HOOK3\n  HOOK3 --> LIST\n  LIST --> CARD\n  CARD --> PLAYER\n  PLAYER --> HOOK4\n  BAR --> HOOK5\n\n  subgraph DataLayer\n    API[apiClient using native fetch]\n    STATE[useState/useEffect]\n  end\n\n  HOOK1 -->|POST /v1/chat_patient| API\n  HOOK2 -->|GET /functions/promptjobs/:id| API\n  HOOK3 -->|GET /functions/podcastItems?since=12h| API\n  API --> STATE",
  sequenceDiagram:
    "sequenceDiagram\n  autonumber\n  actor Physician\n  participant Page as Next.js PromptJobPage\n  participant AIC as Flask aichat (/v1/chat_patient)\n  participant AG as LangChain Agent\n  participant AF as Azure Functions (TS)\n  participant DB as Cosmos DB\n  participant BL as Blob Storage\n  participant GM as Gemini TTS\n\n  Physician->>Page: Type question & Submit\n  Note over Page: chatUri prop points to /v1/chat_patient\n  Page->>AIC: POST /v1/chat_patient { prompt, window: last12h }\n  AIC->>AF: POST /promptjobs (create)\n  AF->>DB: Insert PromptJob { jobId, status: queued }\n  AF-->>AIC: 201 { jobId }\n  AIC->>AG: Start agent(jobId, window=12h)\n\n  AG->>AF: GET /events?since=12h&groupBy=patient\n  AF->>DB: Query events (labs, vitals, notes)\n  DB-->>AF: Events by patient\n  AF-->>AG: Events payload\n  AG->>AG: Plan outline + draft script per patient\n  AG->>GM: Synthesize(script, voice)\n  GM-->>AG: Audio bytes\n  AG->>BL: PUT /blobs/podcasts/{jobId}/{patientId}.mp3\n  BL-->>AG: audioUrl (SAS)\n  AG->>AF: PUT /podcastItems { jobId, patientId, audioUrl, transcript, status: ready }\n  AF->>DB: Upsert PodcastItem\n  loop Progress updates\n    AG->>AF: PUT /promptjobs/{jobId}/progress { completed, total }\n    AF->>DB: Update PromptJob\n  end\n  AG-->>AIC: Completed\n  AIC->>AF: PUT /promptjobs/{jobId} { status: complete }\n  AF->>DB: Mark complete\n\n  par UI refresh cycle\n    Page->>AF: GET /promptjobs/{jobId}\n    AF-->>Page: { status, progress }\n    Page->>AF: GET /podcastItems?jobId&since=12h\n    AF->>DB: Query podcast items\n    DB-->>AF: Results (with audioUrl)\n    AF-->>Page: PodcastItems[]\n  end\n\n  Physician->>Page: Click play on a patient\n  Page->>BL: GET audioUrl (SAS)\n  BL-->>Page: MP3 stream\n  Page-->>Physician: Audio playback + transcript + controls",
};
