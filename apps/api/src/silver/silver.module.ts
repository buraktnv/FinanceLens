import { Module } from '@nestjs/common';
import { SilverService } from './silver.service';
import { SilverController } from './silver.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SilverController],
  providers: [SilverService],
  exports: [SilverService],
})
export class SilverModule {}
