import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { conflict, notFound } from '../common/api-error.js';
import { mapCategory } from '../common/serializers.js';
import type { CategoryDto } from '../common/api-types.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return categories.map(mapCategory);
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    const existing = await this.prisma.category.findFirst({
      where: { userId, name: dto.name },
    });
    if (existing) {
      throw conflict('Ya existe una categoría con ese nombre');
    }

    const category = await this.prisma.category.create({
      data: { userId, name: dto.name, color: dto.color, icon: dto.icon },
    });
    return mapCategory(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.findOneOrFail(userId, id);

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.category.findFirst({
        where: { userId, name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw conflict('Ya existe una categoría con ese nombre');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      },
    });
    return mapCategory(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOneOrFail(userId, id);

    const [transactions, budgets] = await Promise.all([
      this.prisma.transaction.count({ where: { categoryId: id } }),
      this.prisma.budget.count({ where: { categoryId: id } }),
    ]);
    if (transactions > 0 || budgets > 0) {
      throw conflict('No se puede eliminar una categoría con movimientos o presupuestos asociados');
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private async findOneOrFail(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) {
      throw notFound('Categoría no encontrada');
    }
  }
}
