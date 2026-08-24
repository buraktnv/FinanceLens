import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto';
import { IncomeType, Prisma } from '@prisma/client';

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  private async assertPropertyOwnership(userId: string, propertyId?: string) {
    if (!propertyId) return;
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, userId },
    });
    if (!property) throw new BadRequestException('Invalid property');
  }

  async create(userId: string, dto: CreateIncomeDto) {
    await this.assertPropertyOwnership(userId, dto.propertyId);

    return this.prisma.income.create({
      data: {
        userId,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        type: dto.type,
        description: dto.description,
        date: new Date(dto.date),
        isRecurring: dto.isRecurring || false,
        frequency: dto.frequency,
        propertyId: dto.propertyId,
        notes: dto.notes,
      },
      include: {
        property: true,
      },
    });
  }

  async findAll(
    userId: string,
    filters?: { type?: IncomeType; startDate?: string; endDate?: string },
  ) {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return this.prisma.income.findMany({
      where,
      include: { property: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.income.findFirst({
      where: { id, userId },
      include: { property: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    await this.assertPropertyOwnership(userId, dto.propertyId);

    const updated = await this.prisma.income.updateMany({
      where: { id, userId },
      data: {
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount),
        }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.type && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.propertyId !== undefined && { propertyId: dto.propertyId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    if (updated.count === 0) throw new NotFoundException('Income not found');

    const income = await this.prisma.income.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!income) throw new NotFoundException('Income not found');

    return income;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.prisma.income.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) throw new NotFoundException('Income not found');
  }

  async getSummary(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const incomes = await this.prisma.income.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const recurring = incomes
      .filter((i) => i.isRecurring)
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const byType = incomes.reduce(
      (acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + Number(i.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      month: targetMonth + 1,
      year: targetYear,
      total,
      recurring,
      nonRecurring: total - recurring,
      byType,
      count: incomes.length,
    };
  }
}
