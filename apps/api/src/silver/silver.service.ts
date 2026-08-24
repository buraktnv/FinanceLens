import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSilverDto, UpdateSilverDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SilverService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSilverDto: CreateSilverDto) {
    return this.prisma.silver.create({
      data: {
        userId,
        name: createSilverDto.name,
        quantity: new Prisma.Decimal(createSilverDto.quantity),
        purchasePrice: new Prisma.Decimal(createSilverDto.purchasePrice),
        purchaseDate: new Date(createSilverDto.purchaseDate),
        purity: createSilverDto.purity,
        location: createSilverDto.location,
        notes: createSilverDto.notes,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.silver.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.silver.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, updateSilverDto: UpdateSilverDto) {
    const updated = await this.prisma.silver.updateMany({
      where: { id, userId },
      data: {
        ...(updateSilverDto.name && { name: updateSilverDto.name }),
        ...(updateSilverDto.quantity !== undefined && {
          quantity: new Prisma.Decimal(updateSilverDto.quantity),
        }),
        ...(updateSilverDto.purchasePrice !== undefined && {
          purchasePrice: new Prisma.Decimal(updateSilverDto.purchasePrice),
        }),
        ...(updateSilverDto.purchaseDate && {
          purchaseDate: new Date(updateSilverDto.purchaseDate),
        }),
        ...(updateSilverDto.purity !== undefined && {
          purity: updateSilverDto.purity,
        }),
        ...(updateSilverDto.location !== undefined && {
          location: updateSilverDto.location,
        }),
        ...(updateSilverDto.notes !== undefined && {
          notes: updateSilverDto.notes,
        }),
      },
    });
    if (updated.count === 0)
      throw new NotFoundException('Silver holding not found');

    return this.prisma.silver.findUnique({ where: { id } });
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.prisma.silver.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('Silver holding not found');
  }

  // Get silver summary
  async getSummary(userId: string) {
    const holdings = await this.prisma.silver.findMany({
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
      holdings: holdings.map((h) => ({
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
