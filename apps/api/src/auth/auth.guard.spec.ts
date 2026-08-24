import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../prisma';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let verifyToken: jest.Mock;
  let findUnique: jest.Mock;
  let create: jest.Mock;
  let reflector: { getAllAndOverride: jest.Mock };
  let request: { headers: Record<string, string>; user?: unknown };

  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;

  const supabaseUser = {
    id: 'supabase-id-1',
    email: 'user@example.com',
    user_metadata: { name: 'Test' },
  };

  beforeEach(() => {
    verifyToken = jest.fn();
    findUnique = jest.fn();
    create = jest.fn();
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    request = { headers: { authorization: 'Bearer valid-token' } };

    guard = new AuthGuard(
      { verifyToken } as unknown as SupabaseService,
      reflector as unknown as Reflector,
      { user: { findUnique, create } } as unknown as PrismaService,
    );
  });

  it('bypasses verification for @Public() routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyToken).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    request.headers = {};

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    verifyToken.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('accepts a valid token for an already-mirrored user', async () => {
    verifyToken.mockResolvedValue(supabaseUser);
    findUnique.mockResolvedValue({ id: supabaseUser.id });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(create).not.toHaveBeenCalled();
    expect(request.user).toEqual(supabaseUser);
  });

  it('creates the mirrored user on first sighting', async () => {
    verifyToken.mockResolvedValue(supabaseUser);
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: supabaseUser.id });
    create.mockResolvedValue({ id: supabaseUser.id });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: 'Test',
      },
    });
  });

  it('recovers when a concurrent request wins the lazy-create race (P2002)', async () => {
    verifyToken.mockResolvedValue(supabaseUser);
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: supabaseUser.id });
    create.mockRejectedValue({ code: 'P2002' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('still fails when the refetch after P2002 finds nothing', async () => {
    verifyToken.mockResolvedValue(supabaseUser);
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue({ code: 'P2002' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects tokens without an email instead of writing undefined', async () => {
    verifyToken.mockResolvedValue({ id: supabaseUser.id, user_metadata: {} });
    findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
