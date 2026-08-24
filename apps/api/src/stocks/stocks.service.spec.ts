import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto, UpdateStockDto } from './dto';

describe('StocksService', () => {
  let service: StocksService;
  let prismaService: {
    stock: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const stockId = 'stock-1';

  // Minimal stand-in for Prisma.Decimal: the service only calls Number() on it.
  const decimalLike = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  const mockStock = {
    id: stockId,
    userId,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: decimalLike('10'),
    purchasePrice: decimalLike('150'),
    currency: 'USD',
    purchaseDate: new Date('2024-01-01'),
    broker: 'XTB',
    notes: 'Initial purchase',
    dividends: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    prismaService = {
      stock: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a stock for the given user', async () => {
      const createStockDto: CreateStockDto = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        purchasePrice: 150,
        currency: 'USD',
        purchaseDate: '2024-01-01',
        broker: 'XTB',
        notes: 'Initial purchase',
      };

      prismaService.stock.create.mockResolvedValue(mockStock);

      const result = await service.create(userId, createStockDto);

      expect(prismaService.stock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            symbol: 'AAPL',
            name: 'Apple Inc.',
            currency: 'USD',
          }) as Record<string, unknown>,
          include: { dividends: true },
        }),
      );
      expect(result).toEqual(mockStock);
    });
  });

  describe('findAll', () => {
    it('should return all stocks for the given user', async () => {
      prismaService.stock.findMany.mockResolvedValue([mockStock]);

      const result = await service.findAll(userId);

      expect(prismaService.stock.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          dividends: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockStock]);
    });

    it('should return an empty array when the user has no stocks', async () => {
      prismaService.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the stock owned by the user', async () => {
      prismaService.stock.findFirst.mockResolvedValue(mockStock);

      const result = await service.findOne(userId, stockId);

      expect(prismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: stockId, userId },
        include: {
          dividends: { orderBy: { paymentDate: 'desc' } },
        },
      });
      expect(result).toEqual(mockStock);
    });

    it('should return null when the stock does not exist', async () => {
      prismaService.stock.findFirst.mockResolvedValue(null);

      const result = await service.findOne(userId, stockId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateStockDto: UpdateStockDto = {
      name: 'Apple Inc. Updated',
      quantity: 15,
    };

    it('should update the stock atomically when it is owned by the user', async () => {
      prismaService.stock.updateMany.mockResolvedValue({ count: 1 });
      prismaService.stock.findUnique.mockResolvedValue({
        ...mockStock,
        name: 'Apple Inc. Updated',
      });

      const result = await service.update(userId, stockId, updateStockDto);

      expect(prismaService.stock.updateMany).toHaveBeenCalledWith({
        where: { id: stockId, userId },
        data: expect.objectContaining({
          name: 'Apple Inc. Updated',
        }) as Record<string, unknown>,
      });
      expect(prismaService.stock.findUnique).toHaveBeenCalledWith({
        where: { id: stockId },
        include: { dividends: true },
      });
      expect(result).toEqual({ ...mockStock, name: 'Apple Inc. Updated' });
    });

    it('should throw NotFoundException when the stock is not owned by the user', async () => {
      prismaService.stock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, stockId, updateStockDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.stock.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the stock is deleted after a successful update', async () => {
      prismaService.stock.updateMany.mockResolvedValue({ count: 1 });
      prismaService.stock.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, stockId, updateStockDto),
      ).rejects.toThrow(new NotFoundException('Stock not found'));
    });

    it('should throw NotFoundException when the stock does not exist', async () => {
      prismaService.stock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'missing-id', updateStockDto),
      ).rejects.toThrow(new NotFoundException('Stock not found'));
    });
  });

  describe('remove', () => {
    it('should delete the stock atomically when it is owned by the user', async () => {
      prismaService.stock.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, stockId);

      expect(prismaService.stock.deleteMany).toHaveBeenCalledWith({
        where: { id: stockId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the stock is not owned by the user', async () => {
      prismaService.stock.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, stockId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the stock does not exist', async () => {
      prismaService.stock.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'missing-id')).rejects.toThrow(
        new NotFoundException('Stock not found'),
      );
    });
  });

  describe('getPortfolioSummary', () => {
    it('should aggregate portfolio cost and dividends', async () => {
      const stockWithDividends = {
        ...mockStock,
        quantity: decimalLike('10'),
        purchasePrice: decimalLike('150'),
        dividends: [
          { amount: decimalLike('50') },
          { amount: decimalLike('25') },
        ],
      };

      prismaService.stock.findMany.mockResolvedValue([stockWithDividends]);

      const result = await service.getPortfolioSummary(userId);

      expect(prismaService.stock.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { dividends: true },
      });
      expect(result.totalStocks).toBe(1);
      expect(result.totalCost).toBe(1500);
      expect(result.totalDividends).toBe(75);
      expect(result.stocks).toHaveLength(1);
      expect(result.stocks[0]).toEqual(
        expect.objectContaining({
          id: stockId,
          symbol: 'AAPL',
          quantity: 10,
          purchasePrice: 150,
          totalCost: 1500,
        }),
      );
    });

    it('should return net dividends after withholding in the summary', async () => {
      const stockWithTaxedDividends = {
        ...mockStock,
        quantity: decimalLike('10'),
        purchasePrice: decimalLike('150'),
        dividends: [
          {
            amount: decimalLike('100'),
            taxWithheld: decimalLike('15'),
          },
          { amount: decimalLike('50'), taxWithheld: null },
          { amount: decimalLike('25') },
        ],
      };

      prismaService.stock.findMany.mockResolvedValue([stockWithTaxedDividends]);

      const result = await service.getPortfolioSummary(userId);

      expect(result.totalDividends).toBe(160);
    });

    it('should return zeroed totals when the user has no stocks', async () => {
      prismaService.stock.findMany.mockResolvedValue([]);

      const result = await service.getPortfolioSummary(userId);

      expect(result.totalStocks).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.totalDividends).toBe(0);
      expect(result.stocks).toEqual([]);
    });
  });
});
