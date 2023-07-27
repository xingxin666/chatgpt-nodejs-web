export declare namespace Conversation {
    type ConversationStyle = 'Creative' | 'Precise' | 'Balanced';
    type ConversationType = 'SearchQuery' | 'Chat';
    export enum ConversationStr {
        Creative = "h3imaginative",
        Precise = "h3precise",
        Balanced = "galileo"
    }
    export type IConversationOpts = {
        convStyle: ConversationStyle;
        messageType: ConversationType;
        conversationId: string;
        conversationSignature: string;
        clientId: string;
    };
    type IMessage = {
        author: string;
        text: string;
        messageType: ConversationType;
    };
    type IArguments = {
        source: string;
        optionsSets: string[];
        allowedMessageTypes: string[];
        isStartOfSession: boolean;
        message: IMessage;
        conversationId: string;
        conversationSignature: string;
        participant: {
            id: string;
        };
    };
    export type IConversationTemplate = {
        arguments: IArguments[];
        invocationId: string;
        target: string;
        type: number;
    };
    export {};
}
export declare function ctrlTemp(path?: string): any;
export declare function ctrlTemp(path?: string, file?: any): void;
export declare function setConversationTemplate(params?: Partial<Conversation.IConversationOpts>): Conversation.IConversationTemplate;
