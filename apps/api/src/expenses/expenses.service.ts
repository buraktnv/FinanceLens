import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { ExpenseCategory, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private async assertPropertyOwnership(userId: string, propertyId?: string) {
    if (!propertyId) return;
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, userId },
    });
    if (!property) throw new BadRequestException('Invalid property');
  }

  async create(userId: string, dto: CreateExpenseDto) {
    await this.assertPropertyOwnership(userId, dto.propertyId);

    return this.prisma.expense.create({
      data: {
        userId,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        category: dto.category,
        description: dto.description,
        date: new Date(dto.date),
        isRecurring: dto.isRecurring || false,
        frequency: dto.frequency,
        paymentMethod: dto.paymentMethod,
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
    filters?: {
      category?: ExpenseCategory;
      startDate?: string;
      endDate?: string;
      paymentMethod?: PaymentMethod;
    },
  ) {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (filters?.category) where.category = filters.category;
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return this.prisma.expense.findMany({
      where,
      include: { property: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.expense.findFirst({
      where: { id, userId },
      include: { property: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.assertPropertyOwnership(userId, dto.propertyId);

    const updated = await this.prisma.expense.updateMany({
      where: { id, userId },
      data: {
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount),
        }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.category && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.paymentMethod !== undefined && {
          paymentMethod: dto.paymentMethod,
        }),
        ...(dto.propertyId !== undefined && { propertyId: dto.propertyId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    if (updated.count === 0) throw new NotFoundException('Expense not found');

    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return expense;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.prisma.expense.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) throw new NotFoundException('Expense not found');
  }

  async getSummary(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const recurring = expenses
      .filter((e) => e.isRecurring)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const byCategory = expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const byPaymentMethod = expenses.reduce(
      (acc, e) => {
        if (e.paymentMethod) {
          acc[e.paymentMethod] = (acc[e.paymentMethod] || 0) + Number(e.amount);
        }
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
      byCategory,
      byPaymentMethod,
      count: expenses.length,
    };
  }
}
