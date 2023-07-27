/// <reference types="node" />
import WebSocket, { MessageEvent } from "ws";
import { IObject, MessageCenter } from "utils-lib-js";
import { ClientRequestArgs } from "http";
import { IConfig, IBingInfoPartial } from "../server/index.js";
export type IWsConfig = {
    address: string | URL;
    options: WebSocket.ClientOptions | ClientRequestArgs;
    protocols: string | string[];
};
export type IMessageOpts = {
    message: string | IObject<any>;
};
export type IConversationMessage = {
    message: string;
    invocationId: string | number;
};
export declare class NewBingSocket extends MessageCenter {
    wsConfig: Partial<IWsConfig>;
    private _config;
    private ws;
    private bingInfo;
    private convTemp;
    private pingInterval;
    constructor(wsConfig: Partial<IWsConfig>, _config?: IConfig);
    mixBingInfo(bingInfo: IBingInfoPartial): this;
    createWs(): this;
    clearWs(): this;
    private throwErr;
    initEvent(): this;
    sendMessage: (opts: IMessageOpts) => void;
    private message;
    private open;
    private close;
    private error;
    sendPingMsg(): void;
    private startInterval;
    private clearInterval;
}
export declare function onMessage(e: MessageEvent): void;
export declare function sendConversationMessage(params?: IConversationMessage): void;
