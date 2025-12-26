import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoldDto, UpdateGoldDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoldService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createGoldDto: CreateGoldDto) {
    return this.prisma.gold.create({
      data: {
        userId,
        name: createGoldDto.name,
        quantity: new Prisma.Decimal(createGoldDto.quantity),
        purchasePrice: new Prisma.Decimal(createGoldDto.purchasePrice),
        purchaseDate: new Date(createGoldDto.purchaseDate),
        purity: createGoldDto.purity,
        location: createGoldDto.location,
        notes: createGoldDto.notes,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.gold.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.gold.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, updateGoldDto: UpdateGoldDto) {
    // First verify ownership
    const gold = await this.prisma.gold.findFirst({
      where: { id, userId },
    });

    if (!gold) {
      return null;
    }

    return this.prisma.gold.update({
      where: { id },
      data: {
        ...(updateGoldDto.name && { name: updateGoldDto.name }),
        ...(updateGoldDto.quantity !== undefined && { quantity: new Prisma.Decimal(updateGoldDto.quantity) }),
        ...(updateGoldDto.purchasePrice !== undefined && { purchasePrice: new Prisma.Decimal(updateGoldDto.purchasePrice) }),
        ...(updateGoldDto.purchaseDate && { purchaseDate: new Date(updateGoldDto.purchaseDate) }),
        ...(updateGoldDto.purity !== undefined && { purity: updateGoldDto.purity }),
        ...(updateGoldDto.location !== undefined && { location: updateGoldDto.location }),
        ...(updateGoldDto.notes !== undefined && { notes: updateGoldDto.notes }),
      },
    });
  }

  async remove(userId: string, id: string) {
    // First verify ownership
    const gold = await this.prisma.gold.findFirst({
      where: { id, userId },
    });

    if (!gold) {
      return null;
    }

    return this.prisma.gold.delete({
      where: { id },
    });
  }

  // Get gold summary
  async getSummary(userId: string) {
    const holdings = await this.prisma.gold.findMany({
      where: { userId },
    });

    const totalQuantity = holdings.reduce((sum, holding) => {
      return sum + Number(holding.quantity);
    }, 0);

    const totalCost = holdings.reduce((sum, holding) => {
      return sum + Number(holding.quantity) * Number(holding.purchasePrice);
    }, 0);

    return {
      totalHoldings: holdings.length,
      totalQuantity,
      totalCost,
      holdings: holdings.map(h => ({
        id: h.id,
        name: h.name,
        quantity: Number(h.quantity),
        purchasePrice: Number(h.purchasePrice),
        purchaseDate: h.purchaseDate,
        purity: h.purity,
        totalCost: Number(h.quantity) * Number(h.purchasePrice),
      })),
    };
  }
}
