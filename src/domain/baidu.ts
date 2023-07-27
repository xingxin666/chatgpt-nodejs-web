import { ChatBaiduWenxin } from "langchain/chat_models/baiduwenxin";
import { HumanMessage, BaseMessage, AIMessage } from "langchain/schema";
import Keyv from "keyv";
import QuickLRU from "quick-lru";
import { v4 as uuidv4 } from 'uuid'

const apiKey = process.env.BAIDU_API_KEY
const secretKey = process.env.BAIDU_SECRET_KEY

export enum Role {
    USER = 'user',
    ASSISTANT = 'assistant'
}
export class ChatMessage {
    role: string;
    content: string;
}

let _messageStore = new Keyv({
    //todo 改成redis或Mysql
    store: new QuickLRU({ maxSize: 100000 })
});

async function _defaultGetMessageById(id) : Promise<ChatMessage[]> {
    const res = await _messageStore.get(id);
    return res;
}

async function _defaultUpsertMessage(id, messages: ChatMessage[]) {
    await _messageStore.set(id, messages);
}


export async function replyBaidu(prompt, model, res, options, systemMessage, temperature) {
    try {
        const conversationId = options.conversationId == null ? uuidv4() : options.conversationId

        res.write(`${JSON.stringify({ text: '处理中，请稍后...' })}`)
        let nrNewTokens = 0;
        let streamedCompletion = "";
        //创建对象
        const ernieTurbo = new ChatBaiduWenxin({
            baiduApiKey: apiKey, 
            baiduSecretKey: secretKey,
            modelName: model,
            streaming: true,
            callbacks: [
            {
                async handleLLMNewToken(token: string) {
                    nrNewTokens += 1;
                    streamedCompletion += token;
                    globalThis.console.log(`${new Date().toLocaleString()} nrNewTokens:${nrNewTokens} token:${token}`)
                    res.write(`\n${JSON.stringify({ text: streamedCompletion, conversationId: conversationId })}`)
                 },
            },
            ],
        });

        let baseMessages : BaseMessage[]  = []
        //取缓存当前会话历史对话记录
        let historyMessages : ChatMessage[] = await _defaultGetMessageById(conversationId)
        if(historyMessages ==null){
            historyMessages = []

        }
        historyMessages.forEach(function(chatMessage) {
            if (chatMessage.role == Role.USER) {
                baseMessages.push(new HumanMessage(chatMessage.content))
            } else if (chatMessage.role == Role.ASSISTANT) {
                baseMessages.push(new AIMessage(chatMessage.content))
            } else {
                baseMessages.push(new HumanMessage(chatMessage.content))
            }
        });
        baseMessages.push(new HumanMessage(prompt))

        globalThis.console.log(`${new Date().toLocaleString()} 百度请求:`, baseMessages)
        // 调用接口
        const response = await ernieTurbo.call(baseMessages);
        globalThis.console.log(`${new Date().toLocaleString()} 百度响应:${response.content}`)

        if (historyMessages.length > 20) {
            //取几条最新的对话，避免token超过最大限制
            //todo 需改成判断token数量截取
            historyMessages =  historyMessages.slice(historyMessages.length - 20)
        }
        const chatMessageReq : ChatMessage = {role: Role.USER, content: prompt}
        historyMessages.push(chatMessageReq)
        const chatMessageRes : ChatMessage = {role: Role.ASSISTANT, content: response.content}
        historyMessages.push(chatMessageRes)
        //更新缓存
        _defaultUpsertMessage(conversationId, historyMessages)
    }
    catch (error) {
        console.error('error - replyBaidu -> ', error)
        res.write(`\n${JSON.stringify({ text: `请求异常` })}`)
    }
}