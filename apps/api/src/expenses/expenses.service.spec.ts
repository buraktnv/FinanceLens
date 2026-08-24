import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseCategory } from '@prisma/client';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaService: {
    expense: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    property: {
      findFirst: jest.Mock;
    };
  };

  const userId = 'user-1';
  const expenseId = 'expense-1';

  // Minimal stand-in for Prisma.Decimal: the service only calls Number() on it.
  const decimalLike = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  const mockExpense = {
    id: expenseId,
    userId,
    amount: decimalLike('250'),
    currency: 'TRY',
    category: ExpenseCategory.GROCERIES,
    description: 'Weekly groceries',
    date: new Date('2024-03-01'),
    isRecurring: false,
    frequency: null,
    paymentMethod: 'CARD',
    propertyId: null,
    notes: null,
    property: null,
  };

  beforeEach(async () => {
    prismaService = {
      expense: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      property: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const baseDto = {
      amount: 250,
      category: ExpenseCategory.GROCERIES,
      date: '2024-03-01',
    };

    it('should pass a valid owned propertyId through to the created expense', async () => {
      prismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId,
      });
      prismaService.expense.create.mockResolvedValue({
        ...mockExpense,
        propertyId: 'property-1',
      });

      const result = await service.create(userId, {
        ...baseDto,
        propertyId: 'property-1',
      });

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: 'property-1', userId },
      });
      expect(prismaService.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          propertyId: 'property-1',
        }) as Record<string, unknown>,
        include: { property: true },
      });
      expect(result.propertyId).toBe('property-1');
    });

    it('should throw BadRequestException when the propertyId belongs to another user', async () => {
      prismaService.property.findFirst.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          ...baseDto,
          propertyId: 'foreign-property',
        }),
      ).rejects.toThrow(new BadRequestException('Invalid property'));
      expect(prismaService.expense.create).not.toHaveBeenCalled();
    });

    it('should not check ownership when no propertyId is provided', async () => {
      prismaService.expense.create.mockResolvedValue(mockExpense);

      await service.create(userId, baseDto);

      expect(prismaService.property.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when the new propertyId belongs to another user', async () => {
      prismaService.property.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, expenseId, { propertyId: 'foreign-property' }),
      ).rejects.toThrow(new BadRequestException('Invalid property'));
      expect(prismaService.expense.updateMany).not.toHaveBeenCalled();
    });

    it('should update the expense atomically with a valid owned propertyId', async () => {
      prismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId,
      });
      prismaService.expense.updateMany.mockResolvedValue({ count: 1 });
      prismaService.expense.findUnique.mockResolvedValue({
        ...mockExpense,
        propertyId: 'property-1',
      });

      const result = await service.update(userId, expenseId, {
        propertyId: 'property-1',
      });

      expect(prismaService.expense.updateMany).toHaveBeenCalledWith({
        where: { id: expenseId, userId },
        data: { propertyId: 'property-1' },
      });
      expect(prismaService.expense.findUnique).toHaveBeenCalledWith({
        where: { id: expenseId },
        include: { property: true },
      });
      expect(result.propertyId).toBe('property-1');
    });

    it('should throw NotFoundException when the expense is not owned by the user', async () => {
      prismaService.expense.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-expense', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.expense.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the expense does not exist', async () => {
      prismaService.expense.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'missing-expense', {}),
      ).rejects.toThrow(new NotFoundException('Expense not found'));
    });

    it('should throw NotFoundException when the expense is deleted after a successful update', async () => {
      prismaService.expense.updateMany.mockResolvedValue({ count: 1 });
      prismaService.expense.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, expenseId, { amount: 100 }),
      ).rejects.toThrow(new NotFoundException('Expense not found'));
    });
  });

  describe('remove', () => {
    it('should delete the expense atomically when it is owned by the user', async () => {
      prismaService.expense.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, expenseId);

      expect(prismaService.expense.deleteMany).toHaveBeenCalledWith({
        where: { id: expenseId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the expense is not owned by the user', async () => {
      prismaService.expense.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-expense')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
