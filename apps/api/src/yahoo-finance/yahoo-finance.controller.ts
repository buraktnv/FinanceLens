import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('yahoo-finance')
@UseGuards(AuthGuard)
export class YahooFinanceController {
  constructor(private readonly yahooFinanceService: YahooFinanceService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.yahooFinanceService.searchSymbol(query);
  }

  @Get('quote/:symbol')
  async getQuote(@Param('symbol') symbol: string) {
    return this.yahooFinanceService.getQuote(symbol);
  }

  @Get('historical/:symbol')
  async getHistorical(
    @Param('symbol') symbol: string,
    @Query('period1') period1: string,
    @Query('period2') period2: string,
    @Query('interval') interval?: string,
  ) {
    return this.yahooFinanceService.getHistoricalData(
      symbol,
      parseInt(period1),
      parseInt(period2),
      interval || '1d',
    );
  }
}
