-- Migration: 20260926_categories_module
-- Description: Entidade Category global (gerenciada por ADMIN) e vínculo opcional com Task

-- Consulta 001: Criação da tabela categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Consulta 002: Índice para soft delete
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- Consulta 003: Coluna opcional de categoria na tabela tasks
ALTER TABLE "tasks" ADD COLUMN "categoryId" UUID;

-- Consulta 004: Índice para filtrar tarefas por categoria
CREATE INDEX "tasks_categoryId_idx" ON "tasks"("categoryId");

-- Consulta 005: Foreign key de tasks para categories
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;