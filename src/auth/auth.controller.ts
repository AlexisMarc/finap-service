import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, AuthSessionDto } from '../common/api-types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<AuthSessionDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  @HttpCode(204)
  logout(): void {
    return;
  }

  @Get('session')
  async session(@CurrentUser() user: AuthUser): Promise<{ user: AuthSessionDto['user'] }> {
    return { user: await this.authService.getSession(user.userId) };
  }
}
