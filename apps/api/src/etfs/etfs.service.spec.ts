import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EtfsService } from './etfs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EtfsService', () => {
  let service: EtfsService;
  let prismaService: {
    eTF: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const etfId = 'etf-1';

  const mockEtf = {
    id: etfId,
    userId,
    symbol: 'VWCE',
    name: 'Vanguard FTSE All-World',
    distributions: [],
  };

  beforeEach(async () => {
    prismaService = {
      eTF: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtfsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<EtfsService>(EtfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update the etf atomically when it is owned by the user', async () => {
      prismaService.eTF.updateMany.mockResolvedValue({ count: 1 });
      prismaService.eTF.findUnique.mockResolvedValue({
        ...mockEtf,
        name: 'Updated ETF',
      });

      const result = await service.update(userId, etfId, {
        name: 'Updated ETF',
      });

      expect(prismaService.eTF.updateMany).toHaveBeenCalledWith({
        where: { id: etfId, userId },
        data: { name: 'Updated ETF' },
      });
      expect(prismaService.eTF.findUnique).toHaveBeenCalledWith({
        where: { id: etfId },
        include: { distributions: true },
      });
      expect(result.name).toBe('Updated ETF');
    });

    it('should throw NotFoundException when the etf is not owned by the user', async () => {
      prismaService.eTF.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-etf', { name: 'Updated ETF' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.eTF.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the etf does not exist', async () => {
      prismaService.eTF.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update(userId, 'missing-etf', {})).rejects.toThrow(
        new NotFoundException('ETF not found'),
      );
    });
  });

  describe('remove', () => {
    it('should delete the etf atomically when it is owned by the user', async () => {
      prismaService.eTF.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, etfId);

      expect(prismaService.eTF.deleteMany).toHaveBeenCalledWith({
        where: { id: etfId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the etf is not owned by the user', async () => {
      prismaService.eTF.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-etf')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the etf does not exist', async () => {
      prismaService.eTF.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'missing-etf')).rejects.toThrow(
        new NotFoundException('ETF not found'),
      );
    });
  });
});
