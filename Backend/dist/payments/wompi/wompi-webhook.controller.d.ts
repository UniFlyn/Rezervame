export declare class WompiWebhookController {
    handleWompiWebhook(_payload: unknown, _signature?: string): Promise<{
        received: boolean;
    }>;
}
