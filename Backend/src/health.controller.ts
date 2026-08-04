import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from './prisma.service';
import { getFirebaseAdminStatus } from './auth/firebase-auth.util';
import { isS3Configured } from './storage/s3.config';

function sanitizeDbError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replace(/postgresql:\/\/[^\s'"]+/gi, 'postgresql://***')
    .replace(/\/\/[^@\s]+@/g, '//***@')
    .slice(0, 240);
}

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return { ok: true, service: 'rezervame-backend', basePath: '/api' };
  }

  @Get('api')
  apiRoot() {
    return { ok: true, service: 'rezervame-backend', basePath: '/api' };
  }

  @Get('api/v1/health')
  async v1Health(@Res({ passthrough: true }) res: Response) {
    const checks: Record<string, string> = {
      api: 'ok',
      postgres: 'unknown',
      redis: process.env.REDIS_URL ? 'configured' : 'not_configured',
      s3: isS3Configured() ? 'ok' : 'not_configured',
      firebaseAdmin: getFirebaseAdminStatus(),
    };

    let postgresDetail: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = 'ok';
    } catch (err) {
      checks.postgres = 'error';
      postgresDetail =
        sanitizeDbError(err) ||
        this.prisma.lastConnectError ||
        'Database unreachable. Check DATABASE_URL on Render and Neon project status.';
    }

    const healthy = checks.postgres === 'ok';
    const payload: Record<string, unknown> = {
      ok: healthy,
      service: 'rezervame-backend',
      path: '/api/v1/health',
      checks,
      timestamp: new Date().toISOString(),
      databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    };
    if (postgresDetail) {
      payload.postgresError = postgresDetail;
    }

    if (!healthy) {
      res.status(503);
    }

    return payload;
  }
}
