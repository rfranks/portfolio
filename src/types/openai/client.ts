export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: unknown;
};

export type OpenAIChatCompletionRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  top_p?: number;
  response_format?: unknown;
  reasoning_effort?: "minimal" | "low" | "medium" | "high";
  max_tokens?: number;
  max_completion_tokens?: number;
};

export type OpenAIResponsesRequest = {
  model: string;
  input: unknown;
  tools?: unknown[];
  tool_choice?: unknown;
};

export type OpenAIResponsesResult = Record<string, unknown>;

export type OpenAIChatCompletionResult = {
  usage?: {
    completion_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: unknown;
    };
  }>;
};

export type OpenAIEndpointPath = "/chat/completions" | "/responses" | "/models";
