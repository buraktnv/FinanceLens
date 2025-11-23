import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEurobondDto, UpdateEurobondDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EurobondsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEurobondDto) {
    return this.prisma.eurobond.create({
      data: {
        userId,
        name: dto.name,
        isin: dto.isin,
        faceValue: new Prisma.Decimal(dto.faceValue),
        purchasePrice: new Prisma.Decimal(dto.purchasePrice),
        quantity: new Prisma.Decimal(dto.quantity),
        couponRate: new Prisma.Decimal(dto.couponRate),
        currency: dto.currency,
        purchaseDate: new Date(dto.purchaseDate),
        maturityDate: new Date(dto.maturityDate),
        couponFrequency: dto.couponFrequency || 2,
        broker: dto.broker,
        notes: dto.notes,
      },
      include: {
        couponPayments: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.eurobond.findMany({
      where: { userId },
      include: {
        couponPayments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { maturityDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.eurobond.findFirst({
      where: { id, userId },
      include: {
        couponPayments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateEurobondDto) {
    const eurobond = await this.prisma.eurobond.findFirst({
      where: { id, userId },
    });

    if (!eurobond) return null;

    return this.prisma.eurobond.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.isin !== undefined && { isin: dto.isin }),
        ...(dto.faceValue !== undefined && { faceValue: new Prisma.Decimal(dto.faceValue) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: new Prisma.Decimal(dto.purchasePrice) }),
        ...(dto.quantity !== undefined && { quantity: new Prisma.Decimal(dto.quantity) }),
        ...(dto.couponRate !== undefined && { couponRate: new Prisma.Decimal(dto.couponRate) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.purchaseDate && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.maturityDate && { maturityDate: new Date(dto.maturityDate) }),
        ...(dto.couponFrequency !== undefined && { couponFrequency: dto.couponFrequency }),
        ...(dto.broker !== undefined && { broker: dto.broker }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        couponPayments: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const eurobond = await this.prisma.eurobond.findFirst({
      where: { id, userId },
    });

    if (!eurobond) return null;

    return this.prisma.eurobond.delete({ where: { id } });
  }

  async getPortfolioSummary(userId: string) {
    const eurobonds = await this.prisma.eurobond.findMany({
      where: { userId },
      include: { couponPayments: true },
    });

    const totalFaceValue = eurobonds.reduce((sum, e) => sum + Number(e.faceValue) * Number(e.quantity), 0);
    const totalCurrentValue = eurobonds.reduce((sum, e) => sum + Number(e.purchasePrice) * Number(e.quantity) / 100, 0);
    const annualCouponIncome = eurobonds.reduce((sum, e) => sum + Number(e.faceValue) * Number(e.quantity) * Number(e.couponRate), 0);

    return {
      totalBonds: eurobonds.length,
      totalFaceValue,
      totalCurrentValue,
      annualCouponIncome,
      eurobonds: eurobonds.map(e => ({
        id: e.id,
        name: e.name,
        isin: e.isin,
        faceValue: Number(e.faceValue),
        quantity: Number(e.quantity),
        couponRate: Number(e.couponRate),
        currency: e.currency,
        maturityDate: e.maturityDate,
      })),
    };
  }
}
