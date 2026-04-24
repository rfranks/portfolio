type ChoiceOption<TValue = string> = {
  label: string;
  value: TValue;
  description?: string;
};

export const shenaniganTypeChoices: ChoiceOption<string>[] = [
  {
    value: "default",
    label: "Default (image -> stylized -> motion)",
    description: "Example: a portrait transformed into style and then short motion.",
  },
  {
    value: "book-to-limited-series",
    label: "Book to Limited Series",
    description: "Example: cover + manuscript + trailer + episode plan.",
  },
  {
    value: "work-to-series-adaptation",
    label: "Work to Series Adaptation",
    description: "Example: source work and adaptation trailer/series artifacts.",
  },
  {
    value: "palmylyzer-pro",
    label: "Palm Analysis",
    description: "Example: raw image + analysis image + line map + reading.",
  },
  {
    value: "song-recording",
    label: "Song Recording",
    description: "Example: album cover + audio + lyrics markdown.",
  },
];

export const competencyOptionIconChoices: ChoiceOption<string>[] = [
  {
    label: "Auto awesome (AI/LLM)",
    value: "auto-awesome",
    description: "Best fit for AI/LLM and RAG systems.",
  },
  {
    label: "Web (Frontend)",
    value: "web",
    description: "Frontend and UX-focused competency category.",
  },
  {
    label: "DNS (Backend)",
    value: "dns",
    description: "Backend services and API category.",
  },
  {
    label: "Cloud",
    value: "cloud",
    description: "Cloud platforms and DevOps workflows.",
  },
  {
    label: "Hub (Data/Integration)",
    value: "hub",
    description: "Data, integration, and distributed connections.",
  },
  {
    label: "Groups (Leadership)",
    value: "groups",
    description: "Leadership and team collaboration category.",
  },
  {
    label: "Custom icon key",
    value: "__custom__",
    description: "Enter your own icon key string.",
  },
];
