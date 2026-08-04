import {
  Controller,
  Headers,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoryDemoSeedService } from './category-demo.seed.service';

/**
 * Idempotent demo data for empty discovery categories.
 * POST https://rezervame.onrender.com/api/cron/seed-category-demos
 * Header: Authorization: Bearer <CRON_SECRET>
 */
@Controller('api/cron')
export class CategoryDemoSeedController {
  constructor(private readonly seed: CategoryDemoSeedService) {}

  @Post('seed-category-demos')
  async seedCategoryDemos(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token !== secret) {
      throw new UnauthorizedException('Invalid cron authorization');
    }
    return this.seed.run();
  }
}
