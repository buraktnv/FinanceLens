import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { StocksModule } from './stocks/stocks.module';
import { EurobondsModule } from './eurobonds/eurobonds.module';
import { EtfsModule } from './etfs/etfs.module';
import { IncomesModule } from './incomes/incomes.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { YahooFinanceModule } from './yahoo-finance/yahoo-finance.module';
import { CashModule } from './cash/cash.module';
import { GoldModule } from './gold/gold.module';
import { SilverModule } from './silver/silver.module';
import { PreciousMetalsModule } from './precious-metals/precious-metals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StocksModule,
    EurobondsModule,
    EtfsModule,
    IncomesModule,
    ExpensesModule,
    CashModule,
    GoldModule,
    SilverModule,
    PreciousMetalsModule,
    DashboardModule,
    YahooFinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
