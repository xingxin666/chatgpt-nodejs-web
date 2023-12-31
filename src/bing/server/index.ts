import { MessageCenter, Request, catchAwait } from 'utils-lib-js'
import crypto from 'crypto';

import { Conversation } from '../helpers/index';
import e from 'express';

import axios from 'axios'

import { fetch,  } from '../isomorphic'

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');


// 请求对话信息接口的响应信息
export interface IBingInfo {
  convStyle?: Conversation.ConversationStyle
  clientId: string
  conversationId: string
  conversationSignature: string
  x_sydney_encryptedconversationsignature: string
  result: {
    message: unknown
    value: string
  }
}
// 切换可选项，防止报错
export type IBingInfoPartial = Partial<IBingInfo>
// 静态配置项结构
export interface IConfig {
  cookie: string
  proxyUrl: string
  bingUrl: string
  bingSocketUrl: string
}
// NewBingServer的构造函数配置
export interface IOpts {
  agent: any
}
export class NewBingServer extends MessageCenter {
  bingInfo: IBingInfo
  readonly bingRequest: Request
  constructor(private opts: IOpts, private _config: IConfig = config) {
    super()
    const { bingUrl } = this._config
    this.bingRequest = new Request(bingUrl)// 初始化请求地址
    this.initServer()// 初始化request: 拦截器等
  }

  // 抛错事件
  throwErr(err: any) {
    console.error(err)
    this.emit('new-bing:server:error', err)
  }

  // 赋值当前请求的信息
  async initConversation() {
    this.bingInfo = await this.createConversation()
  }

  // 初始化request
  initServer() {
    this.bingRequest.use('error', console.error).errFn(e =>{
      console.error('bingRequest-error1',e)
    })
    //this.bingRequest.use("response", console.log)
  }

  // 发起请求
  private async createConversation() {
    const { _config, opts, bingInfo } = this
    const { agent } = opts
    if (bingInfo)
      return bingInfo
    const { cookie } = _config
    const options: any = {
      headers: { cookie ,
                 accept: 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"113.0.1774.50"',
                'sec-ch-ua-full-version-list': '"Microsoft Edge";v="113.0.1774.50", "Chromium";v="113.0.5672.127", "Not-A.Brand";v="24.0.0.0"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"15.0.0"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'sec-ms-gec': genRanHex(64).toUpperCase(),
                'sec-ms-gec-version': '1-115.0.1866.1',
                'x-ms-client-request-id': crypto.randomUUID(),
                'x-ms-useragent': 'azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.10.0 OS/Win32',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50',
                Referer: 'https://www.bing.com/search?q=Bing+AI&showconv=1',
                'Referrer-Policy': 'origin-when-cross-origin',
                
      },
    }

    //if (agent)
    //  options.agent = agent
      
    console.log('createConversation_options=',options)

    try {
      const query = new URLSearchParams({
        bundleVersion: '1.1055.8',
      })

      const response = await fetch(`https://www.bing.com/turing/conversation/create?${query}`, { method: 'GET', ...options})
        .catch(e => {
          console.log(e)
        })

      console.log(response)
      if (!response) {
        return null
      }
      const data = await response.json().catch((e: any) => {})
      console.log('data', data)
      if (!data?.clientId) {
        return null
      }
      console.log('headers X-Sydney-encryptedconversationsignature', response.headers.get('X-Sydney-encryptedconversationsignature') )
      // 可以使用 headers 对象访问响应头信息
      data.x_sydney_encryptedconversationsignature = response.headers.get('X-Sydney-encryptedconversationsignature') || undefined
      //data.conversationSignature = headers['x-sydney-conversationsignature']
      // data 包含响应体内容
      console.log('res data', data);
      return data
    } catch (error) {
      console.error(error);
      return null
    }
      
  }
}
