import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth';

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
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentTransactions(
      userId,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
