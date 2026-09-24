import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { unauthorized } from '../api-error.js';
import type { AuthUser } from '../api-types.js';

interface GuardRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

interface JwtPayload {
  sub: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const header = request.headers['authorization'];
    const value = Array.isArray(header) ? header[0] : header;

    if (!value || !value.startsWith('Bearer ')) {
      throw unauthorized();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(value.slice(7));
      request.user = { userId: payload.sub };
      return true;
    } catch {
      throw unauthorized('Token inválido o expirado');
    }
  }
}
