import { z } from "zod";
import type { AIPrompt } from "@/types/ai/prompt";

export const aiBufferSize = 4096 * 5;
export const PDF_PROMPT_CONTEXT_TOKEN = "{{context}}";

const promptOutputSchema = z.object({
  response: z.string(),
});

const userQuestionInputSchema = z.object({
  context: z.string(),
});

const summarizePdfInputSchema = z.object({
  context: z.string(),
});

export const userQuestionAIPrompt: AIPrompt<
  typeof userQuestionInputSchema,
  typeof promptOutputSchema
> = {
  id: "pdf-user-question",
  inputSchema: userQuestionInputSchema,
  outputSchema: promptOutputSchema,
  promptText: ({ context }) => `
Begin relevant content
${context}
End relevant content

Provide relevant answers within the scope of the relevant content.
Answer the question only if it is based on the provided relevant content.
If the question is outside the scope of the relevant content, respond "I didn't see that in the PDF.  Try asking a different question.".
Refrain from answering questions that are outside the scope of the relevant content.
Use markdown markup to format your response for better readability.
Use markdown to bold key points in your response, including names.
Use markdown to italicize quotes or other key points in your response.
Refrain from using the words "markdown", "PDF", "PDF file" or "file" in your response.
Refrain from responding with questions.
Refrain from including any additional questions in your response.
`,
};

export const summarizePDFAIPrompt: AIPrompt<
  typeof summarizePdfInputSchema,
  typeof promptOutputSchema
> = {
  id: "pdf-summarize",
  inputSchema: summarizePdfInputSchema,
  outputSchema: promptOutputSchema,
  promptText: ({ context }) => `
The user uploaded a PDF file. The content of the file has been converted to markdown.
Here is the markdown content:
\`\`\`
${context}
\`\`\`
Refrain from mentioning the PDF file or the markdown conversion process in your response.
Do not say the words "markdown", "PDF", "PDF file" or "file" in your response.
Refrain from omitting any important information in your response.
Refrain from omitting quotes or key points in your response.
`,
};

// Backward-compatible exports used by existing app call sites.
export const userQuestionPrompt = userQuestionAIPrompt.promptText({
  context: PDF_PROMPT_CONTEXT_TOKEN,
});
export const summarizePDFPrompt = summarizePDFAIPrompt.promptText({
  context: PDF_PROMPT_CONTEXT_TOKEN,
});
