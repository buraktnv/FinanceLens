import { Test, TestingModule } from '@nestjs/testing';
import { EurobondsService } from './eurobonds.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EurobondsService', () => {
  let service: EurobondsService;
  let prismaService: {
    eurobond: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-1';

  const decimal = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  function bond(overrides: {
    id?: string;
    faceValue: string;
    purchasePrice: string;
    quantity: string;
    couponRate: string;
  }) {
    return {
      id: overrides.id ?? 'bond-1',
      userId,
      name: 'US TREASURY 2030',
      isin: 'US912810QY32',
      faceValue: decimal(overrides.faceValue),
      purchasePrice: decimal(overrides.purchasePrice),
      quantity: decimal(overrides.quantity),
      couponRate: decimal(overrides.couponRate),
      currency: 'USD',
      couponFrequency: 2,
      couponPayments: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };
  }

  beforeEach(async () => {
    prismaService = {
      eurobond: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EurobondsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<EurobondsService>(EurobondsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPortfolioSummary', () => {
    const seededBonds = [
      bond({
        id: 'bond-a',
        faceValue: '1000',
        purchasePrice: '980',
        quantity: '10',
        couponRate: '0.0525',
      }),
      bond({
        id: 'bond-b',
        faceValue: '5000',
        purchasePrice: '5100',
        quantity: '2',
        couponRate: '0.031',
      }),
    ];

    it('should value bonds at faceValue x quantity rather than price as percentage of face', async () => {
      prismaService.eurobond.findMany.mockResolvedValue(seededBonds);

      const result = await service.getPortfolioSummary(userId);

      expect(prismaService.eurobond.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { couponPayments: true },
      });
      expect(result.totalCurrentValue).toBeCloseTo(20000, 6);
      expect(result.totalCurrentValue).toBe(result.totalFaceValue);
    });

    it('should compute totalCost as absolute purchasePrice x quantity without percentage scaling', async () => {
      prismaService.eurobond.findMany.mockResolvedValue(seededBonds);

      const result = await service.getPortfolioSummary(userId);

      expect(result.totalCost).toBeCloseTo(980 * 10 + 5100 * 2, 6);
    });

    it('should treat couponRate as a decimal fraction when computing annualCouponIncome', async () => {
      prismaService.eurobond.findMany.mockResolvedValue([
        bond({
          id: 'bond-fraction',
          faceValue: '10000',
          purchasePrice: '9900',
          quantity: '1',
          couponRate: '0.0525',
        }),
      ]);

      const result = await service.getPortfolioSummary(userId);

      expect(result.annualCouponIncome).toBeCloseTo(10000 * 0.0525, 6);
    });

    it('should exclude zero-face-value bonds from valuation and coupon income while still costing them', async () => {
      prismaService.eurobond.findMany.mockResolvedValue([
        bond({
          id: 'bond-zero-face',
          faceValue: '0',
          purchasePrice: '900',
          quantity: '5',
          couponRate: '0.04',
        }),
      ]);

      const result = await service.getPortfolioSummary(userId);

      expect(result.totalBonds).toBe(1);
      expect(result.totalFaceValue).toBe(0);
      expect(result.totalCurrentValue).toBe(0);
      expect(result.annualCouponIncome).toBe(0);
      expect(result.totalCost).toBeCloseTo(900 * 5, 6);
    });
  });
});
