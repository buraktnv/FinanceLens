import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController input validation', () => {
  let app: INestApplication;

  const findAll = jest.fn().mockResolvedValue([]);
  const findOne = jest.fn().mockResolvedValue(null);
  const remove = jest.fn().mockResolvedValue(undefined);
  const getSummary = jest.fn().mockResolvedValue({ total: 0 });

  beforeEach(async () => {
    findAll.mockClear().mockResolvedValue([]);
    findOne.mockClear().mockResolvedValue(null);
    remove.mockClear().mockResolvedValue(undefined);
    getSummary.mockClear().mockResolvedValue({ total: 0 });

    const moduleRef = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: {
            create: jest.fn(),
            findAll,
            findOne,
            update: jest.fn(),
            remove,
            getSummary,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Simulate the authenticated user that the global guard would attach.
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = { id: 'user-1' };
      next();
    });
    // Mirror main.ts global pipe configuration.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  describe('GET /expenses filters', () => {
    it('rejects an unknown category value with 400', async () => {
      await request(app.getHttpServer())
        .get('/expenses?category=GARBAGE')
        .expect(400);
      expect(findAll).not.toHaveBeenCalled();
    });

    it('rejects an unknown paymentMethod value with 400', async () => {
      await request(app.getHttpServer())
        .get('/expenses?paymentMethod=carrier-pigeon')
        .expect(400);
      expect(findAll).not.toHaveBeenCalled();
    });

    it('rejects a malformed endDate with 400', async () => {
      await request(app.getHttpServer())
        .get('/expenses?endDate=12/31/2024')
        .expect(400);
      expect(findAll).not.toHaveBeenCalled();
    });

    it('passes valid filters through to the service', async () => {
      await request(app.getHttpServer())
        .get(
          '/expenses?category=GROCERIES&paymentMethod=CASH&startDate=2024-01-01&endDate=2024-01-31',
        )
        .expect(200);
      expect(findAll).toHaveBeenCalledWith('user-1', {
        category: 'GROCERIES',
        paymentMethod: 'CASH',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });

    it('strips unknown query params via whitelist', async () => {
      await request(app.getHttpServer())
        .get('/expenses?category=RENT&hacker=1')
        .expect(200);
      expect(findAll).toHaveBeenCalledWith('user-1', { category: 'RENT' });
    });
  });

  describe('GET /expenses/summary month/year', () => {
    it('rejects a non-numeric month with 400', async () => {
      await request(app.getHttpServer())
        .get('/expenses/summary?month=abc')
        .expect(400);
      expect(getSummary).not.toHaveBeenCalled();
    });

    it('rejects months outside 1-12 and years outside 1970-2100 with 400', async () => {
      await request(app.getHttpServer())
        .get('/expenses/summary?month=13')
        .expect(400);
      await request(app.getHttpServer())
        .get('/expenses/summary?year=1969')
        .expect(400);
      expect(getSummary).not.toHaveBeenCalled();
    });

    it('converts the 1-based month and passes it through with the year', async () => {
      await request(app.getHttpServer())
        .get('/expenses/summary?month=12&year=2025')
        .expect(200);
      expect(getSummary).toHaveBeenCalledWith('user-1', 11, 2025);
    });
  });

  describe(':id params', () => {
    it('rejects a non-UUID id with 400', async () => {
      await request(app.getHttpServer())
        .delete('/expenses/not-a-uuid')
        .expect(400);
      expect(remove).not.toHaveBeenCalled();
    });
  });
});
