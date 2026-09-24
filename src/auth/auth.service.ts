import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { unauthorized } from '../common/api-error.js';
import { mapUser } from '../common/serializers.js';
import type { AuthSessionDto, UserDto } from '../common/api-types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthSessionDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw unauthorized('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw unauthorized('Credenciales inválidas');
    }

    const token = await this.jwtService.signAsync({ sub: user.id });
    return { token, user: mapUser(user) };
  }

  async getSession(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw unauthorized('Sesión inválida');
    }
    return mapUser(user);
  }
}
