import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { YahooFinanceController } from './yahoo-finance.controller';
import { YahooFinanceService } from './yahoo-finance.service';
import { SupabaseService } from '../auth/supabase.service';
import { PrismaService } from '../prisma';

describe('YahooFinanceController input validation', () => {
  let app: INestApplication;
  let fetchMock: jest.Mock<
    Promise<{ ok: boolean; json: () => Promise<unknown> }>,
    [string]
  >;

  const AUTH_HEADER = 'Bearer test-token';

  beforeEach(async () => {
    // Real YahooFinanceService so its interval whitelist participates; only
    // the outbound HTTP call is stubbed.
    const moduleRef = await Test.createTestingModule({
      controllers: [YahooFinanceController],
      providers: [
        YahooFinanceService,
        // The real AuthGuard runs against these stubs.
        {
          provide: SupabaseService,
          useValue: {
            verifyToken: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: 'test@test.com',
              user_metadata: {},
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    fetchMock = jest.fn<
      Promise<{ ok: boolean; json: () => Promise<unknown> }>,
      [string]
    >();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ chart: { result: [{ meta: { symbol: 'AAPL' } }] } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  describe('GET /yahoo-finance/historical/:symbol', () => {
    it('rejects a path-traversal interval with 400 without calling upstream', async () => {
      await request(app.getHttpServer())
        .get(
          '/yahoo-finance/historical/AAPL?period1=1700000000&period2=1700086400&interval=../x',
        )
        .set('Authorization', AUTH_HEADER)
        .expect(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an interval outside the whitelist with 400', async () => {
      await request(app.getHttpServer())
        .get(
          '/yahoo-finance/historical/AAPL?period1=1700000000&period2=1700086400&interval=5m',
        )
        .set('Authorization', AUTH_HEADER)
        .expect(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects non-numeric period bounds with 400', async () => {
      await request(app.getHttpServer())
        .get('/yahoo-finance/historical/AAPL?period1=abc&period2=1700086400')
        .set('Authorization', AUTH_HEADER)
        .expect(400);
      await request(app.getHttpServer())
        .get('/yahoo-finance/historical/AAPL?period1=1700000000&period2=xyz')
        .set('Authorization', AUTH_HEADER)
        .expect(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('passes valid params through including a whitelisted interval', async () => {
      await request(app.getHttpServer())
        .get(
          '/yahoo-finance/historical/AAPL?period1=1700000000&period2=1700086400&interval=1wk',
        )
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain(
        '/v8/finance/chart/' +
          encodeURIComponent('AAPL') +
          '?period1=1700000000&period2=1700086400&interval=1wk',
      );
    });

    it('defaults to the 1d interval when none is provided', async () => {
      await request(app.getHttpServer())
        .get(
          '/yahoo-finance/historical/AAPL?period1=1700000000&period2=1700086400',
        )
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('interval=1d');
    });
  });
});
