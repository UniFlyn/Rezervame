import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
export declare class BookingReminderService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    processDueReminders(): Promise<{
        sent24h: number;
        sent1h: number;
        skipped: boolean;
    }>;
    private send24hReminders;
    private send1hReminders;
}
