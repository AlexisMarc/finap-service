import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { notFound } from '../common/api-error';
import { mapAccount, mapUser } from '../common/serializers';
import type { AccountDto, Currency, UserDto } from '../common/api-types';
import type { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw notFound('Usuario no encontrado');
    }
    return mapUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserDto> {
    await this.getMe(userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency as Currency } : {}),
      },
    });
    return mapUser(user);
  }

  async listAccounts(userId: string): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return accounts.map(mapAccount);
  }
}
