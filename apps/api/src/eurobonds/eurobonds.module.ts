import { Module } from '@nestjs/common';
import { EurobondsService } from './eurobonds.service';
import { EurobondsController } from './eurobonds.controller';

@Module({
  controllers: [EurobondsController],
  providers: [EurobondsService],
  exports: [EurobondsService],
})
export class EurobondsModule {}
