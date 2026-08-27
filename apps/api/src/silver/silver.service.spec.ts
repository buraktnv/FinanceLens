import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SilverService } from './silver.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SilverService', () => {
  let service: SilverService;
  let prismaService: {
    silver: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const silverId = 'silver-1';

  // Minimal stand-in for Prisma.Decimal: the service only calls Number() on it.
  const decimalLike = (value: string): { toString: () => string } => ({
    toString: () => value,
  });

  const mockHolding = {
    id: silverId,
    userId,
    name: 'Silver Bar',
    quantity: decimalLike('100'),
    purchasePrice: decimalLike('30'),
  };

  beforeEach(async () => {
    prismaService = {
      silver: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SilverService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<SilverService>(SilverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update the holding atomically when it is owned by the user', async () => {
      prismaService.silver.updateMany.mockResolvedValue({ count: 1 });
      prismaService.silver.findUnique.mockResolvedValue({
        ...mockHolding,
        name: 'Updated Bar',
      });

      const result = await service.update(userId, silverId, {
        name: 'Updated Bar',
      });

      expect(prismaService.silver.updateMany).toHaveBeenCalledWith({
        where: { id: silverId, userId },
        data: { name: 'Updated Bar' },
      });
      expect(prismaService.silver.findUnique).toHaveBeenCalledWith({
        where: { id: silverId },
      });
      expect(result.name).toBe('Updated Bar');
    });

    it('should throw NotFoundException when the holding is not owned by the user', async () => {
      prismaService.silver.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-silver', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.silver.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the holding does not exist', async () => {
      prismaService.silver.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'missing-silver', {}),
      ).rejects.toThrow(new NotFoundException('Silver holding not found'));
    });
  });

  describe('remove', () => {
    it('should delete the holding atomically when it is owned by the user', async () => {
      prismaService.silver.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, silverId);

      expect(prismaService.silver.deleteMany).toHaveBeenCalledWith({
        where: { id: silverId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the holding is not owned by the user', async () => {
      prismaService.silver.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-silver')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the holding does not exist', async () => {
      prismaService.silver.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'missing-silver')).rejects.toThrow(
        new NotFoundException('Silver holding not found'),
      );
    });
  });
});
