import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma';
import { SupabaseService } from './../src/auth/supabase.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Stub out providers that talk to external services so the test can run
      // without a real database or Supabase project. The health route is
      // marked @Public(), so the guard never touches these at request time.
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: jest.fn(),
        verifyToken: jest.fn(),
        getUserById: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts: routes are served under the /api global prefix.
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('/api (GET) health check is public and returns Hello World!', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });
});
