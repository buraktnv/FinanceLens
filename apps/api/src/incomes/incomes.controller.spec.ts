import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';

describe('IncomesController input validation', () => {
  let app: INestApplication;

  const findAll = jest.fn().mockResolvedValue([]);
  const findOne = jest.fn().mockResolvedValue(null);
  const remove = jest.fn().mockResolvedValue(undefined);
  const getSummary = jest.fn().mockResolvedValue({ total: 0 });

  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    findAll.mockClear().mockResolvedValue([]);
    findOne.mockClear().mockResolvedValue(null);
    remove.mockClear().mockResolvedValue(undefined);
    getSummary.mockClear().mockResolvedValue({ total: 0 });

    const moduleRef = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [
        {
          provide: IncomesService,
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

  describe('GET /incomes filters', () => {
    it('rejects an unknown type value with 400', async () => {
      await request(app.getHttpServer())
        .get('/incomes?type=GARBAGE')
        .expect(400);
      expect(findAll).not.toHaveBeenCalled();
    });

    it('rejects a malformed startDate with 400', async () => {
      await request(app.getHttpServer())
        .get('/incomes?startDate=not-a-date')
        .expect(400);
      expect(findAll).not.toHaveBeenCalled();
    });

    it('passes a valid type filter through to the service', async () => {
      await request(app.getHttpServer())
        .get('/incomes?type=SALARY')
        .expect(200);
      expect(findAll).toHaveBeenCalledWith('user-1', { type: 'SALARY' });
    });
  });

  describe('GET /incomes/summary month/year', () => {
    it('rejects a non-numeric month with 400', async () => {
      await request(app.getHttpServer())
        .get('/incomes/summary?month=abc')
        .expect(400);
      expect(getSummary).not.toHaveBeenCalled();
    });

    it('rejects months outside 1-12 and years outside 1970-2100 with 400', async () => {
      await request(app.getHttpServer())
        .get('/incomes/summary?month=0')
        .expect(400);
      await request(app.getHttpServer())
        .get('/incomes/summary?month=13')
        .expect(400);
      await request(app.getHttpServer())
        .get('/incomes/summary?year=1969')
        .expect(400);
      await request(app.getHttpServer())
        .get('/incomes/summary?year=2101')
        .expect(400);
      expect(getSummary).not.toHaveBeenCalled();
    });

    it('converts the 1-based month and passes it through with the year', async () => {
      await request(app.getHttpServer())
        .get('/incomes/summary?month=3&year=2024')
        .expect(200);
      expect(getSummary).toHaveBeenCalledWith('user-1', 2, 2024);
    });
  });

  describe(':id params', () => {
    it('rejects a non-UUID id with 400', async () => {
      await request(app.getHttpServer()).get('/incomes/not-a-uuid').expect(400);
      expect(findOne).not.toHaveBeenCalled();
    });

    it('accepts a valid UUID and passes it through', async () => {
      await request(app.getHttpServer())
        .delete(`/incomes/${VALID_UUID}`)
        .expect(200);
      expect(remove).toHaveBeenCalledWith('user-1', VALID_UUID);
    });
  });
});
