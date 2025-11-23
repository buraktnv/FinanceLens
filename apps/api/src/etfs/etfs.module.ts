import { Module } from '@nestjs/common';
import { EtfsService } from './etfs.service';
import { EtfsController } from './etfs.controller';

@Module({
  controllers: [EtfsController],
  providers: [EtfsService],
  exports: [EtfsService],
})
export class EtfsModule {}
