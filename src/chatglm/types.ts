import type { ChatMessage,openai } from 'chatgpt'

export interface RequestOptions {
  prompt: string
  model: string
  temperature?: number | null;
  lastContext?: { conversationId?: string; parentMessageId?: string; messageId?: string; messages?: Array<openai.ChatCompletionRequestMessage> }
  process?: (chat: ChatMessage) => void
  systemMessage?: string
}
