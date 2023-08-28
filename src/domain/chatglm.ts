import type { ChatMessage } from '../chatglm'
import { chatReplyProcess } from '../chatglm'

export async function replyChatGLM(prompt, model, res, options, systemMessage, temperature) {
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
