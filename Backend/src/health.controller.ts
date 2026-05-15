import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

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
  async v1Health() {
    const checks: Record<string, string> = {
      api: 'ok',
      postgres: 'unknown',
      redis: process.env.REDIS_URL ? 'configured' : 'not_configured',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    const healthy = checks.postgres === 'ok';
    const payload = {
      ok: healthy,
      service: 'rezervame-backend',
      path: '/api/v1/health',
      checks,
      timestamp: new Date().toISOString(),
    };

    if (!healthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
