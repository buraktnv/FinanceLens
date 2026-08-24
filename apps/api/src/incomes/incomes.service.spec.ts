import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeType } from '@prisma/client';

describe('IncomesService', () => {
  let service: IncomesService;
  let prismaService: {
    income: {
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
  const incomeId = 'income-1';

  // Minimal stand-in for Prisma.Decimal: the service only calls Number() on it.
  const decimalLike = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  const mockIncome = {
    id: incomeId,
    userId,
    amount: decimalLike('5000'),
    currency: 'TRY',
    type: IncomeType.SALARY,
    description: 'Monthly salary',
    date: new Date('2024-03-01'),
    isRecurring: true,
    frequency: 'MONTHLY',
    propertyId: null,
    notes: null,
    property: null,
  };

  beforeEach(async () => {
    prismaService = {
      income: {
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
        IncomesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const baseDto = {
      amount: 5000,
      type: IncomeType.SALARY,
      date: '2024-03-01',
    };

    it('should pass a valid owned propertyId through to the created income', async () => {
      prismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId,
      });
      prismaService.income.create.mockResolvedValue({
        ...mockIncome,
        propertyId: 'property-1',
      });

      const result = await service.create(userId, {
        ...baseDto,
        propertyId: 'property-1',
      });

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: 'property-1', userId },
      });
      expect(prismaService.income.create).toHaveBeenCalledWith({
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
        service.create(userId, { ...baseDto, propertyId: 'foreign-property' }),
      ).rejects.toThrow(new BadRequestException('Invalid property'));
      expect(prismaService.income.create).not.toHaveBeenCalled();
    });

    it('should not check ownership when no propertyId is provided', async () => {
      prismaService.income.create.mockResolvedValue(mockIncome);

      await service.create(userId, baseDto);

      expect(prismaService.property.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when the new propertyId belongs to another user', async () => {
      prismaService.property.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, incomeId, { propertyId: 'foreign-property' }),
      ).rejects.toThrow(new BadRequestException('Invalid property'));
      expect(prismaService.income.updateMany).not.toHaveBeenCalled();
    });

    it('should update the income atomically with a valid owned propertyId', async () => {
      prismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId,
      });
      prismaService.income.updateMany.mockResolvedValue({ count: 1 });
      prismaService.income.findUnique.mockResolvedValue({
        ...mockIncome,
        propertyId: 'property-1',
      });

      const result = await service.update(userId, incomeId, {
        propertyId: 'property-1',
      });

      expect(prismaService.income.updateMany).toHaveBeenCalledWith({
        where: { id: incomeId, userId },
        data: { propertyId: 'property-1' },
      });
      expect(prismaService.income.findUnique).toHaveBeenCalledWith({
        where: { id: incomeId },
        include: { property: true },
      });
      expect(result.propertyId).toBe('property-1');
    });

    it('should throw NotFoundException when the income is not owned by the user', async () => {
      prismaService.income.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-income', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.income.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the income does not exist', async () => {
      prismaService.income.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'missing-income', {}),
      ).rejects.toThrow(new NotFoundException('Income not found'));
    });
  });

  describe('remove', () => {
    it('should delete the income atomically when it is owned by the user', async () => {
      prismaService.income.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, incomeId);

      expect(prismaService.income.deleteMany).toHaveBeenCalledWith({
        where: { id: incomeId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the income is not owned by the user', async () => {
      prismaService.income.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-income')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
