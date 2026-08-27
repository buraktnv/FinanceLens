import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth';
import { LIMIT_PIPE } from '../common/pipes';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@CurrentUser('id') userId: string) {
    return this.dashboardService.getOverview(userId);
  }

  @Get('transactions')
  getRecentTransactions(
    @CurrentUser('id') userId: string,
    @Query('limit', LIMIT_PIPE) limit?: number,
  ) {
    return this.dashboardService.getRecentTransactions(userId, limit ?? 10);
  }
}
