import { ERNIEBotApi, Configuration ,CreateCompletionRequest} from '../baidu'
import * as dotenv from 'dotenv'
import { isNotEmptyString } from '../utils/is'

dotenv.config()

const apiKey = process.env.BAIDU_API_KEY
const secretKey = process.env.BAIDU_SECRET_KEY

if (!isNotEmptyString(apiKey) && !isNotEmptyString(secretKey))
  throw new Error('Missing BAIDU_API_KEY or BAIDU_SECRET_KEY environment variable')


let config: Configuration = {apiKey, secretKey}
let api: ERNIEBotApi = new ERNIEBotApi(config)

export async function replyBaidu(prompt, model, res, options, systemMessage, temperature) {
    try {
        res.write(`${JSON.stringify({ text: '处理中，请稍后...' })}`)
        let request: CreateCompletionRequest = {prompt, model, stream: true}
        const response = api.createCompletion(request)
        res.write(`\n${JSON.stringify({ text: (await response).data.result })}`)
    }
    catch (error) {
        console.error('error - replyBaidu -> ', error)
        res.write(`\n${JSON.stringify({ text: `请求异常` })}`)
    }
}