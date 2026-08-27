import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashDto, UpdateCashDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCashDto: CreateCashDto) {
    return this.prisma.cash.create({
      data: {
        userId,
        accountName: createCashDto.accountName,
        balance: new Prisma.Decimal(createCashDto.balance),
        currency: createCashDto.currency,
        accountType: createCashDto.accountType,
        bankName: createCashDto.bankName,
        notes: createCashDto.notes,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.cash.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.cash.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, updateCashDto: UpdateCashDto) {
    const updated = await this.prisma.cash.updateMany({
      where: { id, userId },
      data: {
        ...(updateCashDto.accountName && {
          accountName: updateCashDto.accountName,
        }),
        ...(updateCashDto.balance !== undefined && {
          balance: new Prisma.Decimal(updateCashDto.balance),
        }),
        ...(updateCashDto.currency && { currency: updateCashDto.currency }),
        ...(updateCashDto.accountType !== undefined && {
          accountType: updateCashDto.accountType,
        }),
        ...(updateCashDto.bankName !== undefined && {
          bankName: updateCashDto.bankName,
        }),
        ...(updateCashDto.notes !== undefined && {
          notes: updateCashDto.notes,
        }),
      },
    });
    if (updated.count === 0)
      throw new NotFoundException('Cash account not found');

    const cash = await this.prisma.cash.findUnique({ where: { id } });
    if (!cash) throw new NotFoundException('Cash account not found');

    return cash;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.prisma.cash.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('Cash account not found');
  }

  // Get cash summary
  async getSummary(userId: string) {
    const cashAccounts = await this.prisma.cash.findMany({
      where: { userId },
    });

    // Group by currency
    const byCurrency: Record<string, number> = {};
    let totalBalance = 0;

    cashAccounts.forEach((account) => {
      const balance = Number(account.balance);
      const currency = account.currency;

      if (!byCurrency[currency]) {
        byCurrency[currency] = 0;
      }
      byCurrency[currency] += balance;

      // For now, just sum all balances (future: apply conversion rates)
      totalBalance += balance;
    });

    return {
      totalAccounts: cashAccounts.length,
      totalBalance,
      byCurrency,
      accounts: cashAccounts.map((a) => ({
        id: a.id,
        accountName: a.accountName,
        balance: Number(a.balance),
        currency: a.currency,
        accountType: a.accountType,
        bankName: a.bankName,
      })),
    };
  }
}
