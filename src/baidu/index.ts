import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
const OAUTH_URL = 'https://aip.baidubce.com/oauth/2.0/token'


export interface Configuration {
    accessToken?: string;
    apiKey?: string;
    secretKey?: string;

}
const QequestUrlMap = {
    'ERNIE-Bot': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    'ERNIE-Bot-turbo': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant'
}
export interface RequestBase {
    temperature?: number;
    topP?: number;
    penaltyScore?: number;
    stream?: boolean;
    userId?: string;
    model?: string;
}
export enum Role {
    USER = 'user',
    ASSISTANT = 'assistant'
}
export interface ChatCompletionRequestMessage {
    role: Role;
    content: string;
}
export interface CreateChatCompletionRequest extends RequestBase {
    messages: ChatCompletionRequestMessage[];
}
export interface CreateCompletionRequest extends RequestBase {
    messages?: ChatCompletionRequestMessage[];
    prompt: string;
}
export type CompletionResponse = {
    id: string;
    object: string;
    created: number;
    result: string;
    is_truncated: boolean;
    need_clear_history: boolean;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
export class ERNIEBotApi {
    accessToken = ''
    apiKey = ''
    secretKey = ''
    constructor(config: Configuration) {
        const accessToken = config.accessToken;
        const apiKey = config.apiKey;
        const secretKey = config.secretKey;
        if (!(apiKey && secretKey) && !accessToken) {
            throw new Error('ERNIE Bot requires either an access token or an API key and secret key pair')
        }
        this.accessToken = accessToken ?? '';
        this.apiKey = apiKey ?? '';
        this.secretKey = secretKey ?? '';
    }

    public async createCompletion(createCompletionRequest: CreateCompletionRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CompletionResponse>> {
        const url = this.completioneUrl(createCompletionRequest.model)
        const data = this.completionData(createCompletionRequest)

        globalThis.console.log(`${new Date().toLocaleString()} 百度请求:${JSON.stringify(data)}`)
        const response = await this.request(url, data, options)
        globalThis.console.log(`${new Date().toLocaleString()} 百度响应:${JSON.stringify(response.data)}`)

        return response
    }
    public async createEmbedding() {
        // TODO
    }
    private async getAccessToken(): Promise<string> {
        if (this.isUseAPIKey) {
            const { data } = await axios({
                url: OAUTH_URL,
                method: 'GET',
                params: {
                    grant_type: 'client_credentials',
                    client_id: this.apiKey,
                    client_secret: this.secretKey
                }
            })
            global.console.log('getAccessToken_data:', data)
            this.accessToken = data.access_token
            return data.access_token
        } else {
            return this.accessToken
        }
    }
    // prefer using APIKey
    private get isUseAPIKey() {
        return this.apiKey && this.secretKey
    }
    private completioneUrl(modelType: string) {
        console.log('modelType:',modelType)
        return QequestUrlMap[modelType]
    }
    private getDefaultParams(requestBase: RequestBase) {
        const { temperature = 0.95, topP = 0.8, penaltyScore = 1.0, stream = false, userId = '' } = requestBase
        return {
            temperature,
            topP,
            penaltyScore,
            stream,
            userId,
        }
    }
    private completionData(completionRequest: CreateCompletionRequest) {
        let messages
        if ('messages' in completionRequest) {
            messages = completionRequest.messages
        } else {
            messages = [{ role: Role.USER, content: completionRequest.prompt }]
        }
        return {
            messages,
            ...this.getDefaultParams(completionRequest)
        };
    }
    private async request(url: string, data: any, options: AxiosRequestConfig) {
        return await axios({
            method: 'POST',
            url,
            params: {
                access_token: await this.getAccessToken()
            },
            data,
            ...options
        })
    }
}