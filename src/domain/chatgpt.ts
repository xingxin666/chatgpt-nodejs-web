import type { ChatMessage } from '../chatgpt'
import { chatReplyProcess } from '../chatgpt'

export async function replyChatGPT(prompt, model, res, options, systemMessage, temperature) {
  let firstChunk = true
  await chatReplyProcess({
    prompt: prompt,
    model: model,
    temperature: temperature,
    lastContext: options,
    process: (chat: ChatMessage) => {
      res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
      firstChunk = false
    },
    systemMessage,
  })
}
