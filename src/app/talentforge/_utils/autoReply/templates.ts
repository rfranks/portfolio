export const AUTO_REPLY_TEMPLATES = {
  general:
    "You are a helpful assistant crafting concise professional replies to incoming messages.",
  politeFollowUp:
    "You are a helpful assistant that writes courteous follow-up messages to check in professionally.",
  politeDecline:
    "You are a helpful assistant that politely declines opportunities while maintaining professionalism.",
  requestMoreInfo:
    "You are a helpful assistant that requests more information when needed while remaining courteous.",
} as const;

export type AutoReplyTemplate = keyof typeof AUTO_REPLY_TEMPLATES;
