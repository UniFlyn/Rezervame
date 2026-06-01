export type PostmarkEnvConfig = {
    apiKey: string;
    fromEmail: string;
    replyTo: string;
    messageStream: string;
    webhookToken: string | null;
};
export declare function readPostmarkConfigFromEnv(): PostmarkEnvConfig | null;
export declare function readPostmarkConfig(): PostmarkEnvConfig | null;
export declare function isPostmarkConfigured(): boolean;
