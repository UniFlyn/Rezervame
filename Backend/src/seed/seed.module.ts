import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CategoryDemoSeedController } from './category-demo-seed.controller';
import { CategoryDemoSeedService } from './category-demo.seed.service';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryDemoSeedController],
  providers: [CategoryDemoSeedService],
})
export class SeedModule {}
