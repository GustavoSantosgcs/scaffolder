import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;

  const mockCategory = {
    id: 'category-uuid-1',
    title: 'Estudos',
    description: 'Tarefas da faculdade',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Antes de cada teste: um 'mock bank' novo
  beforeEach(() => {
    prisma = {
      category: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      task: {
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  it('cria categoria quando o título está disponível', async () => {
    prisma.category.findFirst.mockResolvedValue(null); // nenhuma com o mesmo título
    prisma.category.create.mockResolvedValue(mockCategory);

    const result = await service.create({ title: '  Estudos  ', description: 'Tarefas da faculdade' });

    expect(result.title).toBe('Estudos');
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { title: 'Estudos', description: 'Tarefas da faculdade' },
    });
  });

  it('rejeita título duplicado (ignorando maiúsculas) com 409', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory); // já existe "Estudos"

    await expect(service.create({ title: 'estudos' })).rejects.toThrow(ConflictException);
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('retorna 404 ao buscar categoria inexistente', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(service.findById('nao-existe')).rejects.toThrow(NotFoundException);
  });

  it('ao excluir, desvincula as tarefas e faz soft delete', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory);

    await service.remove(mockCategory.id);

    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { categoryId: mockCategory.id },
      data: { categoryId: null },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: mockCategory.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});