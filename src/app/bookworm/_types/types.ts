export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  /** The role of the chat message. */
  role: ChatRole;
  /** The message content. */
  message: string;
  /** Whether there is more message content to load.
   * In other words, the message is streaming and incomplete at the moment.
   */
  hasMore: boolean;
}
