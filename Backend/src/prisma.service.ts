import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Do not crash the process — Render health and CORS preflight need the HTTP server up.
      console.error('[Prisma] Database connection failed on startup:', msg.replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***'));
    }
  }
}
