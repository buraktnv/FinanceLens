import { Module } from '@nestjs/common';
import { PreciousMetalsService } from './precious-metals.service';
import { PreciousMetalsController } from './precious-metals.controller';

@Module({
  controllers: [PreciousMetalsController],
  providers: [PreciousMetalsService],
  exports: [PreciousMetalsService],
})
export class PreciousMetalsModule {}
