import { z } from "zod";

export interface AIPrompt<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> {
  id: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  promptText: (input: z.infer<TInputSchema>) => string;
}
