import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GoldService } from './gold.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GoldService', () => {
  let service: GoldService;
  let prismaService: {
    gold: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const goldId = 'gold-1';

  const mockHolding = {
    id: goldId,
    userId,
    name: 'Quarter Gold',
    quantity: { toString: () => '5' } as any,
    purchasePrice: { toString: () => '4000' } as any,
  };

  beforeEach(async () => {
    prismaService = {
      gold: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoldService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<GoldService>(GoldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update the holding atomically when it is owned by the user', async () => {
      prismaService.gold.updateMany.mockResolvedValue({ count: 1 });
      prismaService.gold.findUnique.mockResolvedValue({
        ...mockHolding,
        name: 'Cumhuriyet Gold',
      });

      const result = await service.update(userId, goldId, {
        name: 'Cumhuriyet Gold',
      });

      expect(prismaService.gold.updateMany).toHaveBeenCalledWith({
        where: { id: goldId, userId },
        data: { name: 'Cumhuriyet Gold' },
      });
      expect(prismaService.gold.findUnique).toHaveBeenCalledWith({
        where: { id: goldId },
      });
      expect(result.name).toBe('Cumhuriyet Gold');
    });

    it('should throw NotFoundException when the holding is not owned by the user', async () => {
      prismaService.gold.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-gold', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.gold.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the holding does not exist', async () => {
      prismaService.gold.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update(userId, 'missing-gold', {})).rejects.toThrow(
        new NotFoundException('Gold holding not found'),
      );
    });
  });

  describe('remove', () => {
    it('should delete the holding atomically when it is owned by the user', async () => {
      prismaService.gold.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, goldId);

      expect(prismaService.gold.deleteMany).toHaveBeenCalledWith({
        where: { id: goldId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the holding is not owned by the user', async () => {
      prismaService.gold.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-gold')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the holding does not exist', async () => {
      prismaService.gold.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'missing-gold')).rejects.toThrow(
        new NotFoundException('Gold holding not found'),
      );
    });
  });
});
