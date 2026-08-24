import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CashService } from './cash.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CashService', () => {
  let service: CashService;
  let prismaService: {
    cash: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const userId = 'user-1';
  const cashId = 'cash-1';

  const mockCash = {
    id: cashId,
    userId,
    accountName: 'Main Account',
    balance: { toString: () => '1000' } as any,
    currency: 'TRY',
    accountType: 'BANK',
    bankName: 'Bank',
    notes: null,
  };

  beforeEach(async () => {
    prismaService = {
      cash: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<CashService>(CashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update the account atomically when it is owned by the user', async () => {
      prismaService.cash.updateMany.mockResolvedValue({ count: 1 });
      prismaService.cash.findUnique.mockResolvedValue({
        ...mockCash,
        accountName: 'Renamed Account',
      });

      const result = await service.update(userId, cashId, {
        accountName: 'Renamed Account',
      });

      expect(prismaService.cash.updateMany).toHaveBeenCalledWith({
        where: { id: cashId, userId },
        data: { accountName: 'Renamed Account' },
      });
      expect(prismaService.cash.findUnique).toHaveBeenCalledWith({
        where: { id: cashId },
      });
      expect(result.accountName).toBe('Renamed Account');
    });

    it('should throw NotFoundException when the account is not owned by the user', async () => {
      prismaService.cash.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'foreign-cash', { accountName: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.cash.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the account does not exist', async () => {
      prismaService.cash.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(userId, 'missing-cash', {}),
      ).rejects.toThrow(new NotFoundException('Cash account not found'));
    });
  });

  describe('remove', () => {
    it('should delete the account atomically when it is owned by the user', async () => {
      prismaService.cash.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(userId, cashId);

      expect(prismaService.cash.deleteMany).toHaveBeenCalledWith({
        where: { id: cashId, userId },
      });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when the account is not owned by the user', async () => {
      prismaService.cash.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'foreign-cash')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the account does not exist', async () => {
      prismaService.cash.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, 'missing-cash')).rejects.toThrow(
        new NotFoundException('Cash account not found'),
      );
    });
  });
});
