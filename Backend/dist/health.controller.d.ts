import type { Response } from 'express';
import { PrismaService } from './prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    root(): {
        ok: boolean;
        service: string;
        basePath: string;
    };
    apiRoot(): {
        ok: boolean;
        service: string;
        basePath: string;
    };
    v1Health(res: Response): Promise<Record<string, unknown>>;
}
