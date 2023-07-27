import { readFileSync, writeFileSync } from 'fs'

export const conversationTemplate = {
  arguments: [
    {
      source: 'cib',
      optionsSets: [
        'deepleo',
        'nlu_direct_response_filter',
        'disable_emoji_spoken_text',
        'responsible_ai_policy_235',
        'enablemm',
        'dtappid',
        'rai253',
        'dv3sugg',
        'h3imaginative',
      ],
      allowedMessageTypes: ['Chat', 'InternalSearchQuery'],
      isStartOfSession: true,
      message: {
        author: 'user',
        inputMethod: 'Keyboard',
        text: '',
        messageType: 'Chat',
      },
      conversationId: '',
      conversationSignature: '',
      participant: {
        id: '',
      },
    },
  ],
  invocationId: '0',
  target: 'chat',
  type: 4,
}

const conTemp: Conversation.IConversationTemplate = conversationTemplate
export namespace Conversation {
    // 对话模型类型
    // Creative：创造力的，Precise：精确的，Balanced：平衡的
    type ConversationStyle = 'Creative' | 'Precise' | 'Balanced'
    // 对话方式
    type ConversationType = 'SearchQuery' | 'Chat' // bing搜索，聊天
    // 模型映射
    export enum ConversationStr {
      Creative = 'h3imaginative',
      Precise = 'h3precise',
      Balanced = 'galileo',
    }
    // 发起对话时传入的参数
    export interface IConversationOpts {
      convStyle: ConversationStyle
      messageType: ConversationType
      conversationId: string
      conversationSignature: string
      clientId: string
    }
    interface IMessage {
      author: string
      text: string
      messageType: ConversationType
    }
    interface IArguments {
      source: string
      optionsSets: string[]
      allowedMessageTypes: string[]
      isStartOfSession: boolean
      message: IMessage
      conversationId: string
      conversationSignature: string
      participant: {
        id: string
      }
    }
    // 发起对话的模板
    export interface IConversationTemplate {
      arguments: IArguments[]
      invocationId: string
      target: string
      type: number
    }
}
// 默认使用精确类型
const { Precise } = Conversation.ConversationStr
// 数据文件缓存(暂时没用上，调试的时候用的)
export function ctrlTemp(path?: string): any
export function ctrlTemp(path?: string, file?: any): void
export function ctrlTemp(path = './temp', file?: string) {
  try {
    if (file)
      return writeFileSync(path, file, 'utf8')

    return readFileSync(path, 'utf8')
  }
  catch (error) { }
}

// 配置socket鉴权及消息模板
export function setConversationTemplate(params: Partial<Conversation.IConversationOpts> = {}): Conversation.IConversationTemplate {
  const {
    convStyle = Precise, messageType = 'Chat', conversationId,
    conversationSignature, clientId,
  } = params
  if (!conversationId || !conversationSignature || !clientId)
    return null
  const args = conTemp.arguments[0]
  conTemp.arguments[0] = {
    ...args,
    conversationId,
    conversationSignature,
    participant: { id: clientId },
  }
  args.optionsSets.push(convStyle)// 这里传入对话风格
  args.message.messageType = messageType// 这里传入对话类型
  return conTemp
}
