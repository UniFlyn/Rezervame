import { PrismaService } from '../prisma.service';
export declare class BookingReminderService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private isConfigured;
    processDueReminders(): Promise<{
        sent24h: number;
        sent1h: number;
        skipped: boolean;
    }>;
    private send24hReminders;
    private send1hReminders;
}
