import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../api-types.js';

interface AuthenticatedRequest {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user as AuthUser;
  },
);
