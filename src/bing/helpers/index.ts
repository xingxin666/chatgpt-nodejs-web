import { readFileSync, writeFileSync } from 'fs'
import crypto from 'crypto';

export namespace Conversation {
    // 对话模型类型
    // Creative：创造力的，Precise：精确的，Balanced：平衡的
    export type ConversationStyle = 'Creative' | 'Precise' | 'Balanced'
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
      tone: string
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
const { Precise, Creative } = Conversation.ConversationStr
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

const getOptionSets = (conversationStyle: string) => {
  return {
    ['Creative']: [
      'nlu_direct_response_filter',
      'deepleo',
      'disable_emoji_spoken_text',
      'responsible_ai_policy_235',
      'enablemm',
      'dv3sugg',
      'machine_affinity',
      'autosave',
      'iyxapbing',
      'iycapbing',
      'h3imaginative',
      'uquopt',
      'gcccomp',
      'utildv3tosah',
      'cpcandi',
      'cpcatral3',
      'cpcatro50',
      'cpcfmql',
      'cpcgnddi',
      'cpcmattr2',
      'cpcmcit1',
      'e2ecacheread',
      'nocitpass',
      'iypapyrus',
      'hlthcndans',
      'dv3suggtrim',
      'eredirecturl',
      'clgalileo',
      'gencontentv3'
    ],
    ['Balanced']: [
      'nlu_direct_response_filter',
      'deepleo',
      'disable_emoji_spoken_text',
      'responsible_ai_policy_235',
      'enablemm',
      'dv3sugg',
      'machine_affinity',
      'autosave',
      'iyxapbing',
      'iycapbing',
      'galileo',
      'saharagenconv5',
      'uquopt',
      'gcccomp',
      'utildv3tosah',
      'cpcandi',
      'cpcatral3',
      'cpcatro50',
      'cpcfmql',
      'cpcgnddi',
      'cpcmattr2',
      'cpcmcit1',
      'e2ecacheread',
      'nocitpass',
      'iypapyrus',
      'hlthcndans',
      'dv3suggtrim',
      'eredirecturl'
    ],
    ['Precise']: [
      'nlu_direct_response_filter',
      'deepleo',
      'disable_emoji_spoken_text',
      'responsible_ai_policy_235',
      'enablemm',
      'dv3sugg',
      'machine_affinity',
      'autosave',
      'iyxapbing',
      'iycapbing',
      'h3precise',
      'clgalileo',
      'gencontentv3',
      'uquopt',
      'gcccomp',
      'utildv3tosah',
      'cpcandi',
      'cpcatral3',
      'cpcatro50',
      'cpcfmql',
      'cpcgnddi',
      'cpcmattr2',
      'cpcmcit1',
      'e2ecacheread',
      'nocitpass',
      'iypapyrus',
      'hlthcndans',
      'dv3suggtrim',
      'eredirecturl'
    ]
  }[conversationStyle]
}

// 配置socket鉴权及消息模板
export function setConversationTemplate(params: Partial<Conversation.IConversationOpts> = {}): Conversation.IConversationTemplate {
  const {
    convStyle = 'Creative', messageType = 'Chat', conversationId,
    conversationSignature, clientId,
  } = params
  //if (!conversationId || !conversationSignature || !clientId)
  if (!conversationId || !clientId)
    return null
  let requestId = crypto.randomUUID()
  let conTemp: Conversation.IConversationTemplate  = {
      arguments: [
        {
          source: 'cib',
          //optionsSets: ["nlu_direct_response_filter", "deepleo", "disable_emoji_spoken_text", "responsible_ai_policy_235", "enablemm", "dv3sugg", "iyxapbing", "iycapbing", "h3imaginative", "clgalileo", "gencontentv3", "uquopt", "log2sph", "iwusrprmpt", "iyjbexp", "vidsumsnip", "eredirecturl"],
		      optionsSets: getOptionSets(convStyle),
          allowedMessageTypes: ["ActionRequest", "Chat", "Context", "InternalSearchQuery", "InternalSearchResult", "Disengaged", "InternalLoaderMessage", "Progress", "RenderCardRequest", "RenderContentRequest", "AdsQuery", "SemanticSerp", "GenerateContentQuery", "SearchQuery"],
		      sliceIds: ["tnamobcf", "adssqovr", "arankc_1_9_3", "rankcf", "tts3", "919qbmetrics0", "prehome", "suppsm140-t", "scpctrlmob", "sydtransctrl", "kcmessfilcf", "806log2sph", "1006raiannos0", "1004usrprmpt", "103wcphi", "927uprofasys0", "919vidsnip", "917fluxvs0"],
          verbosity: "verbose",
		      scenario: "SERP",
          plugins: [],
          traceId: requestId,
		      conversationHistoryOptionsSets: ["autosave", "savemem", "uprofupd", "uprofgen"],
          isStartOfSession: false,
          requestId: requestId,
          message:{
            locale: 'zh-CN',
            market: 'zh-CN',
            author: 'user',
            inputMethod: 'Keyboard',
            text: '',
            messageType: 'Chat',
            location: "lat:47.639557;long:-122.128159;re=1000m;",
            "locationHints": [{
              "SourceType": 1,
              "RegionType": 2,
              "Center": {
                "Latitude": 37.176998138427734,
                "Longitude": -121.75489807128906
              },
              "Radius": 24902,
              "Name": "San Jose, California",
              "Accuracy": 24902,
              "FDConfidence": 0.8999999761581421,
              "CountryName": "United States",
              "CountryConfidence": 9,
              "Admin1Name": "California",
              "PopulatedPlaceName": "San Jose",
              "PopulatedPlaceConfidence": 9,
              "PostCodeName": "95141",
              "UtcOffset": -8,
              "Dma": 0
            }],
            userIpAddress: "2604:a840:3::10c2",
            timestamp: new Date(),
            requestId: requestId,
			      messageId: requestId
          },
          tone: convStyle,
          conversationId: conversationId,
          conversationSignature: conversationSignature,
          spokenTextMode: 'None',
          participant: {
            id: clientId,
          },
        },
      ],
      invocationId: '0',
      target: 'chat',
      type: 4,
    }
  console.log("setConversationTemplate convStyle=",convStyle)
  return conTemp
}
