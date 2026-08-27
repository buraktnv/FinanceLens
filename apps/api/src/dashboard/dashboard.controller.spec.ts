import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController input validation', () => {
  let app: INestApplication;

  const getRecentTransactions = jest.fn().mockResolvedValue([]);

  beforeEach(async () => {
    getRecentTransactions.mockClear().mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getOverview: jest.fn(),
            getRecentTransactions,
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

  it('rejects a non-numeric limit with 400 instead of reaching the service', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/transactions?limit=abc')
      .expect(400);
    expect(getRecentTransactions).not.toHaveBeenCalled();
  });

  it('rejects limits outside the 1-100 range with 400', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/transactions?limit=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/dashboard/transactions?limit=101')
      .expect(400);
    expect(getRecentTransactions).not.toHaveBeenCalled();
  });

  it('passes a valid parsed limit through to the service', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/transactions?limit=25')
      .expect(200);
    expect(getRecentTransactions).toHaveBeenCalledWith('user-1', 25);
  });

  it('defaults to 10 when no limit is provided', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/transactions')
      .expect(200);
    expect(getRecentTransactions).toHaveBeenCalledWith('user-1', 10);
  });
});
