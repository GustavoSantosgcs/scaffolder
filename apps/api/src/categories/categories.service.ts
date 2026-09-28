import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // LISTAR: todas as categorias não excluídas, em ordem alfabética
  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { title: 'asc' },
    });
    return categories.map((category) => this.serialize(category));
  }

  // VER UMA: busca pelo id (erro 404 se não existir)
  async findById(id: string): Promise<CategoryDto> {
    const category = await this.findActiveOrFail(id);
    return this.serialize(category);
  }

  // CRIAR
  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    const title = dto.title.trim();
    await this.ensureTitleIsAvailable(title);

    const created = await this.prisma.category.create({
      data: {
        title,
        description: dto.description?.trim() || null,
      },
    });
    return this.serialize(created);
  }

  // EDITAR
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.findActiveOrFail(id);

    if (dto.title !== undefined) {
      await this.ensureTitleIsAvailable(dto.title.trim(), id);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });
    return this.serialize(updated);
  }

  // EXCLUIR (soft delete): tira a categoria das tarefas e marca como excluída
  async remove(id: string): Promise<void> {
    await this.findActiveOrFail(id);

    // $transaction = as duas operações acontecem juntas, ou nenhuma acontece
    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
      this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  // ---------- Funções auxiliares  ----------

  // Busca uma categoria ativa; se não achar, lança erro 404
  private async findActiveOrFail(id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }
    return category;
  }

  // Regra de negócio: não pode haver duas categorias ativas com o mesmo título
  private async ensureTitleIsAvailable(title: string, ignoreId?: string): Promise<void> {
    const existing = await this.prisma.category.findFirst({
      where: {
        deletedAt: null,
        title: { equals: title, mode: 'insensitive' }, //Maiúsculas e minúsculas contam como iguais
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException('Já existe uma categoria com esse título.');
    }
  }

  // Converte o registro do banco para o formato de resposta (CategoryDto)
  private serialize(category: Category): CategoryDto {
    return {
      id: category.id,
      title: category.title,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}