import { Controller, Get } from '@nestjs/common';
import { PreciousMetalsService } from './precious-metals.service';

@Controller('precious-metals')
export class PreciousMetalsController {
  constructor(
    private readonly preciousMetalsService: PreciousMetalsService,
  ) {}

  @Get('gold/price')
  async getGoldPrice() {
    return this.preciousMetalsService.getGoldPrice();
  }

  @Get('silver/price')
  async getSilverPrice() {
    return this.preciousMetalsService.getSilverPrice();
  }
}
