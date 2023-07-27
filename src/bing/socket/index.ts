import type { ClientRequestArgs } from 'http'
import type { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import WebSocket from 'ws'
import type { IObject } from 'utils-lib-js'
import { MessageCenter, getType, jsonToString, stringToJson } from 'utils-lib-js'
import type { IBingInfoPartial, IConfig } from '../server/index.js'
import type { Conversation } from '../helpers/index.js'
import { setConversationTemplate } from '../helpers/index.js'
const fixStr = ''// 每段对话的标识符,发送接收都有
// websocket配置
export interface IWsConfig {
  address: string | URL
  options: WebSocket.ClientOptions | ClientRequestArgs
  protocols: string | string[]
}
// 发送socket消息的类型
export interface IMessageOpts {
  message: string | IObject<any>
}
// 发送对话的结构
export interface IConversationMessage {
  message: string
  invocationId: string | number
}
export class NewBingSocket extends MessageCenter {
  private ws: WebSocket // ws实例
  private bingInfo: IBingInfoPartial // 请求拿到的conversation信息
  private convTemp: Conversation.IConversationTemplate // 对话发送的消息模板
  private pingInterval: NodeJS.Timeout | string | number // ping计时器
  constructor(public wsConfig: Partial<IWsConfig>, private _config: IConfig) {
    super()
    const { bingSocketUrl } = this._config
    const { address } = wsConfig
    wsConfig.address = bingSocketUrl + address
  }

  // 将conversation信息赋值到消息模板中
  mixBingInfo(bingInfo: IBingInfoPartial) {
    const { conversationId, conversationSignature, clientId } = bingInfo
    this.bingInfo = bingInfo
    this.convTemp = setConversationTemplate({
      conversationId, conversationSignature, clientId,
    })
    return this
  }

  // 创建ws
  createWs() {
    const { wsConfig, ws } = this
    if (ws)
      return this
    const { address, options, protocols } = wsConfig
    this.ws = new WebSocket(address, protocols, options)
    return this
  }

  // 重置ws
  clearWs() {
    const { ws } = this
    if (ws)
      ws.close(4999, 'clearWs')

    this.clearInterval()
    return this
  }

  // 抛错事件
  private throwErr(err: any) {
    this.emit('new-bing:socket:error', err)
  }

  // 开启ws后初始化事件
  initEvent() {
    const { ws, error, close, open, message } = this
    if (!ws)
      this.throwErr('ws未定义，不能初始化事件')
    ws.onerror = error
    ws.onclose = close
    ws.onopen = open
    ws.onmessage = message
    return this
  }

  // 发消息，兼容Object和string
  sendMessage = (opts: IMessageOpts) => {
    const { bingInfo, convTemp, ws } = this
    const { message } = opts
    if (!bingInfo || !convTemp)
      this.throwErr('对话信息未获取，或模板信息未配置，请重新获取信息')
    const __type = getType(message)
    let str = ''
    if (__type === 'string')
      str = message as string

    else if (__type === 'object')
      str = jsonToString(message as IObject<unknown>)

    if (ws) {
      this.emit('send-message', str)
      ws.send(str + fixStr)
    }
  }

  // 收到消息
  private message = (e: MessageEvent) => {
    this.emit('message', e)
    onMessage.call(this, e)
  }

  // ws连接成功
  private open = (e: Event) => {
    this.emit('open', e)
    const { sendMessage } = this
    sendMessage({ message: { protocol: 'json', version: 1 } })// 初始化
  }

  // ws关闭
  private close = (e: CloseEvent) => {
    const { ws } = this
    ws.removeAllListeners()
    this.ws = null
    this.emit('close', e)
  }

  // ws出错
  private error = (e: ErrorEvent) => {
    this.emit('error', e)
    console.log('error')
  }

  // 断线检测
  sendPingMsg() {
    const { ws } = this
    if (!ws)
      this.throwErr('ws未定义，无法发送Ping')
    this.startInterval()
    this.emit('init:finish', {})
  }

  // 开启断线定时器
  private startInterval() {
    this.clearInterval()
    this.pingInterval = setInterval(() => {
      this.sendMessage({ message: { type: 6 } })
    }, 20 * 1000)
  }

  // 清空断线定时器
  private clearInterval() {
    const { pingInterval } = this
    if (pingInterval) {
      clearInterval(pingInterval)
      this.pingInterval = null
    }
  }
}

// 接收到消息
export function onMessage(e: MessageEvent) {
  const dataSource = e.data.toString().split(fixStr)[0]
  const data = stringToJson(dataSource)
  console.log('接收到消息onMessage_data=', JSON.stringify(data))
  const { type } = data ?? {}
  switch (type) {
    case 1:// 对话中
      this.emit('message:ing', data.arguments?.[0]?.messages?.[0])
      break
    case 2:// 对话完成
      this.emit('message:finish', data.item?.messages?.[1])
      // this.clearWs()
      break
    case 6:// 断线检测
      // console.log(data)
      break
    case 7:// Connection closed with an error
      console.log(data)
      break
    default:// 初始化响应
      this.sendPingMsg()
      break
  }
}
// 发送聊天消息
export function sendConversationMessage(params?: IConversationMessage) {
  const { message } = params
  const arg = this.convTemp.arguments[0]
  arg.message.text = message
  arg.isStartOfSession = true// 是否是新对话
  this.convTemp.invocationId = '0' // invocationId.toString()// 第几段对话
  this.sendMessage({ message: this.convTemp })
}
