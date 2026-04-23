export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: unknown;
};

export type OpenAIChatCompletionRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

export type OpenAIResponsesRequest = {
  model: string;
  input: unknown;
  tools?: unknown[];
  tool_choice?: unknown;
};

export type OpenAIResponsesResult = Record<string, unknown>;

export type OpenAIChatCompletionResult = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export type OpenAIEndpointPath = "/chat/completions" | "/responses" | "/models";
