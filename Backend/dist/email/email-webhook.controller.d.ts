import { PrismaService } from '../prisma.service';
type PostmarkWebhookPayload = {
    RecordType?: string;
    Email?: string;
    MessageID?: string;
    Type?: string;
    BouncedAt?: string;
    Description?: string;
};
export declare class EmailWebhookController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handlePostmarkWebhook(payload: PostmarkWebhookPayload, webhookToken?: string): Promise<{
        ok: boolean;
    }>;
    private handleBounce;
    private handleSpamComplaint;
}
export {};
