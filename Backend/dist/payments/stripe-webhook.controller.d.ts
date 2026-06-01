import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
export declare class StripeWebhookController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handleStripe(req: RawBodyRequest<Request>, signature?: string): Promise<{
        received: boolean;
        skipped: string;
    } | {
        received: boolean;
        skipped?: undefined;
    }>;
}
