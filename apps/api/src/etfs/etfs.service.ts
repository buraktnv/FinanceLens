import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtfDto, UpdateEtfDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EtfsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEtfDto) {
    return this.prisma.eTF.create({
      data: {
        userId,
        symbol: dto.symbol,
        name: dto.name,
        quantity: new Prisma.Decimal(dto.quantity),
        purchasePrice: new Prisma.Decimal(dto.purchasePrice),
        currency: dto.currency,
        purchaseDate: new Date(dto.purchaseDate),
        expenseRatio: dto.expenseRatio ? new Prisma.Decimal(dto.expenseRatio) : null,
        broker: dto.broker,
        notes: dto.notes,
      },
      include: {
        distributions: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.eTF.findMany({
      where: { userId },
      include: {
        distributions: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.eTF.findFirst({
      where: { id, userId },
      include: {
        distributions: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateEtfDto) {
    const etf = await this.prisma.eTF.findFirst({ where: { id, userId } });
    if (!etf) return null;

    return this.prisma.eTF.update({
      where: { id },
      data: {
        ...(dto.symbol && { symbol: dto.symbol }),
        ...(dto.name && { name: dto.name }),
        ...(dto.quantity !== undefined && { quantity: new Prisma.Decimal(dto.quantity) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: new Prisma.Decimal(dto.purchasePrice) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.purchaseDate && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.expenseRatio !== undefined && { expenseRatio: dto.expenseRatio ? new Prisma.Decimal(dto.expenseRatio) : null }),
        ...(dto.broker !== undefined && { broker: dto.broker }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        distributions: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const etf = await this.prisma.eTF.findFirst({ where: { id, userId } });
    if (!etf) return null;
    return this.prisma.eTF.delete({ where: { id } });
  }

  async getPortfolioSummary(userId: string) {
    const etfs = await this.prisma.eTF.findMany({
      where: { userId },
      include: { distributions: true },
    });

    const totalValue = etfs.reduce((sum, e) => sum + Number(e.quantity) * Number(e.purchasePrice), 0);
    const totalDistributions = etfs.reduce((sum, e) =>
      sum + e.distributions.reduce((dSum, d) => dSum + Number(d.amount), 0), 0);

    return {
      totalEtfs: etfs.length,
      totalValue,
      totalDistributions,
      etfs: etfs.map(e => ({
        id: e.id,
        symbol: e.symbol,
        name: e.name,
        quantity: Number(e.quantity),
        purchasePrice: Number(e.purchasePrice),
        expenseRatio: e.expenseRatio ? Number(e.expenseRatio) : null,
        currency: e.currency,
        totalValue: Number(e.quantity) * Number(e.purchasePrice),
      })),
    };
  }
}
