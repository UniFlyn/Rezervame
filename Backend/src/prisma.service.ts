import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { normalizeDatabaseUrl } from './database-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /** Last connection error (safe to expose via /api/v1/health). */
  lastConnectError: string | null = null;

  constructor() {
    normalizeDatabaseUrl();
    super();
  }

  async onModuleInit() {
    const attempts = 3;
    for (let i = 0; i < attempts; i++) {
      try {
        await this.$connect();
        this.lastConnectError = null;
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.lastConnectError = msg.replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***');
        console.error(
          `[Prisma] Database connection failed (attempt ${i + 1}/${attempts}):`,
          this.lastConnectError,
        );
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        }
      }
    }
    // HTTP server still starts — health endpoint reports postgres: error.
  }
}
