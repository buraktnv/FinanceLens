import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto, UpdateStockDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createStockDto: CreateStockDto) {
    return this.prisma.stock.create({
      data: {
        userId,
        symbol: createStockDto.symbol,
        name: createStockDto.name,
        quantity: new Prisma.Decimal(createStockDto.quantity),
        purchasePrice: new Prisma.Decimal(createStockDto.purchasePrice),
        currency: createStockDto.currency,
        purchaseDate: new Date(createStockDto.purchaseDate),
        broker: createStockDto.broker,
        notes: createStockDto.notes,
      },
      include: {
        dividends: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.stock.findMany({
      where: { userId },
      include: {
        dividends: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.stock.findFirst({
      where: { id, userId },
      include: {
        dividends: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async update(userId: string, id: string, updateStockDto: UpdateStockDto) {
    // First verify ownership
    const stock = await this.prisma.stock.findFirst({
      where: { id, userId },
    });

    if (!stock) {
      return null;
    }

    return this.prisma.stock.update({
      where: { id },
      data: {
        ...(updateStockDto.symbol && { symbol: updateStockDto.symbol }),
        ...(updateStockDto.name && { name: updateStockDto.name }),
        ...(updateStockDto.quantity !== undefined && { quantity: new Prisma.Decimal(updateStockDto.quantity) }),
        ...(updateStockDto.purchasePrice !== undefined && { purchasePrice: new Prisma.Decimal(updateStockDto.purchasePrice) }),
        ...(updateStockDto.currency && { currency: updateStockDto.currency }),
        ...(updateStockDto.purchaseDate && { purchaseDate: new Date(updateStockDto.purchaseDate) }),
        ...(updateStockDto.broker !== undefined && { broker: updateStockDto.broker }),
        ...(updateStockDto.notes !== undefined && { notes: updateStockDto.notes }),
      },
      include: {
        dividends: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    // First verify ownership
    const stock = await this.prisma.stock.findFirst({
      where: { id, userId },
    });

    if (!stock) {
      return null;
    }

    return this.prisma.stock.delete({
      where: { id },
    });
  }

  // Get portfolio summary
  async getPortfolioSummary(userId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { userId },
      include: {
        dividends: true,
      },
    });

    const totalCost = stocks.reduce((sum, stock) => {
      return sum + Number(stock.quantity) * Number(stock.purchasePrice);
    }, 0);

    const totalDividends = stocks.reduce((sum, stock) => {
      return sum + stock.dividends.reduce((dSum, d) => dSum + Number(d.amount), 0);
    }, 0);

    return {
      totalStocks: stocks.length,
      totalCost,
      totalDividends,
      stocks: stocks.map(s => ({
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        quantity: Number(s.quantity),
        purchasePrice: Number(s.purchasePrice),
        currency: s.currency,
        totalCost: Number(s.quantity) * Number(s.purchasePrice),
      })),
    };
  }
}
