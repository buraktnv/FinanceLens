import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto, UpdateStockDto } from './dto';

describe('StocksService', () => {
  let service: StocksService;
  let prismaService: {
    stock: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-1';
  const stockId = 'stock-1';

  const mockStock = {
    id: stockId,
    userId,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: { toString: () => '10' } as any,
    purchasePrice: { toString: () => '150' } as any,
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
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
          }),
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

    it('should update the stock when it is owned by the user', async () => {
      prismaService.stock.findFirst.mockResolvedValue(mockStock);
      prismaService.stock.update.mockResolvedValue({
        ...mockStock,
        name: 'Apple Inc. Updated',
      });

      const result = await service.update(userId, stockId, updateStockDto);

      expect(prismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: stockId, userId },
      });
      expect(prismaService.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: stockId },
          data: expect.objectContaining({
            name: 'Apple Inc. Updated',
          }),
          include: { dividends: true },
        }),
      );
      expect(result).toEqual({ ...mockStock, name: 'Apple Inc. Updated' });
    });

    it('should return null when the stock is not owned by the user', async () => {
      prismaService.stock.findFirst.mockResolvedValue(null);

      const result = await service.update(userId, stockId, updateStockDto);

      expect(prismaService.stock.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete the stock when it is owned by the user', async () => {
      prismaService.stock.findFirst.mockResolvedValue(mockStock);
      prismaService.stock.delete.mockResolvedValue(mockStock);

      const result = await service.remove(userId, stockId);

      expect(prismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: stockId, userId },
      });
      expect(prismaService.stock.delete).toHaveBeenCalledWith({
        where: { id: stockId },
      });
      expect(result).toEqual(mockStock);
    });

    it('should return null when the stock is not owned by the user', async () => {
      prismaService.stock.findFirst.mockResolvedValue(null);

      const result = await service.remove(userId, stockId);

      expect(prismaService.stock.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getPortfolioSummary', () => {
    it('should aggregate portfolio cost and dividends', async () => {
      const stockWithDividends = {
        ...mockStock,
        quantity: { toString: () => '10' } as any,
        purchasePrice: { toString: () => '150' } as any,
        dividends: [
          { amount: { toString: () => '50' } as any },
          { amount: { toString: () => '25' } as any },
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
