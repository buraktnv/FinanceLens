import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { YahooFinanceModule } from '../yahoo-finance/yahoo-finance.module';

@Module({
  imports: [YahooFinanceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
