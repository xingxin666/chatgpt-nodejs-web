import { Request, MessageCenter } from "utils-lib-js";
export type IBingInfo = {
    clientId: string;
    conversationId: string;
    conversationSignature: string;
    result: {
        message: unknown;
        value: string;
    };
};
export type IBingInfoPartial = Partial<IBingInfo>;
export type IConfig = {
    cookie: string;
    proxyUrl: string;
    bingUrl: string;
    bingSocketUrl: string;
};
export type IOpts = {
    agent: any;
};
export declare class NewBingServer extends MessageCenter {
    private opts;
    private _config;
    bingInfo: IBingInfo;
    readonly bingRequest: Request;
    constructor(opts: IOpts, _config?: IConfig);
    throwErr(err: any): void;
    initConversation(): Promise<void>;
    initServer(): void;
    private createConversation;
}
