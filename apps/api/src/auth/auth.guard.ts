import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from './supabase.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { RequestWithUser } from './request-with-user';
import { PrismaService } from '../prisma';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const user = await this.supabaseService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.email) {
      throw new UnauthorizedException('Email missing from token');
    }

    // Ensure user exists in database (create only on first sighting).
    // Read-on-miss: avoid a DB write on every authenticated request.
    const metadata = user.user_metadata as { name?: string | null } | undefined;

    let existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      try {
        await this.prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: metadata?.name,
          },
        });
      } catch (error) {
        // Concurrent first request won the lazy-create race; the row exists now.
        if ((error as { code?: string })?.code !== 'P2002') {
          throw error;
        }
      }
      existingUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      if (!existingUser) {
        throw new UnauthorizedException('User could not be provisioned');
      }
    }

    // Attach user to request for use in controllers
    request.user = user;
    return true;
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
