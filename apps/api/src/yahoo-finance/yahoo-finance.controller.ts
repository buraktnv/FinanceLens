import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { YahooFinanceService } from './yahoo-finance.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Yahoo Finance')
@ApiBearerAuth()
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
    @Query('period1', ParseIntPipe) period1: number,
    @Query('period2', ParseIntPipe) period2: number,
    @Query('interval') interval?: string,
  ) {
    return this.yahooFinanceService.getHistoricalData(
      symbol,
      period1,
      period2,
      interval || '1d',
    );
  }
}
