import type { FetchFn, openai } from 'chatgpt'

export interface RequestProps {
  prompt: string
  modelCode: string
  options?: ChatContext
  systemMessage: string
  temperature?: number | null;
}

export interface ChatContext {
  conversationId?: string
  parentMessageId?: string
  messageId?: string
  messages?: Array<openai.ChatCompletionRequestMessage>
}

export interface ChatGPTUnofficialProxyAPIOptions {
  accessToken: string
  apiReverseProxyUrl?: string
  model?: string
  debug?: boolean
  headers?: Record<string, string>
  fetch?: FetchFn
}

export interface ModelConfig {
  apiModel?: ApiModel
  reverseProxy?: string
  timeoutMs?: number
  socksProxy?: string
  httpsProxy?: string
  balance?: string
}

export type ApiModel = 'ChatGPTAPI' | 'ChatGPTUnofficialProxyAPI' | undefined