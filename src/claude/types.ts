export class ClaudeError extends Error {
  statusCode?: number
  statusText?: string
  originalError?: Error
}

export interface ChatResponse {
  text: string
  channel: string
  conversationId?: string
  finish?: boolean
}
