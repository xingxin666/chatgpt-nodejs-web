import { Authenticator } from '../claude/index'
import type { ChatResponse } from '../claude/types'

const token = process.env.CLAUDE_TOKEN
const bot = process.env.CLAUDE_BOT
const authenticator = new Authenticator(token, bot)
// 创建一个频道，已存在则直接返回频道ID
let channel

export async function replyClaude(prompt, res, options, systemMessage) {
  try {
    if (!channel)
      channel = await authenticator.newChannel('gpt-claude')

    let firstChunk = true
    const myChat: ChatResponse = await authenticator.sendMessage({
      text: prompt,
      channel,
      conversationId: options.conversationId,
      onMessage: (chat: ChatResponse) => {
        if (firstChunk) {
          res.write(JSON.stringify(chat))
          firstChunk = false
        }
        else {
          res.write(`\n${JSON.stringify(chat)}`)
        }
        console.log(JSON.stringify(chat))
      },
    })

    myChat.finish = true
    res.write(`\n${JSON.stringify(myChat)}`)
  }
  catch (error) {
    console.error('error - replyClaude -> ', error)
    res.write(`\n${JSON.stringify({ text: `系统繁忙，请稍后再试...` })}`)
  }
}
