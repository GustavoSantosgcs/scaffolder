import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Espécie de formulário para CRIAR uma categoria
export class CreateCategoryDto {
  @ApiProperty({ description: 'Título da categoria', example: 'Estudos', minLength: 2, maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'O título deve ter no mínimo 2 caracteres.' })
  @MaxLength(60, { message: 'O título deve ter no máximo 60 caracteres.' })
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria', example: 'Tarefas da faculdade', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres.' })
  description?: string;
}

// Espécie de formulário para EDITAR 
export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Título da categoria', example: 'Faculdade', minLength: 2, maxLength: 60 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O título deve ter no mínimo 2 caracteres.' })
  @MaxLength(60, { message: 'O título deve ter no máximo 60 caracteres.' })
  title?: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres.' })
  description?: string;
}

// Formato da RESPOSTA
export class CategoryDto {
  @ApiProperty({ description: 'Identificador único da categoria', example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  id!: string;

  @ApiProperty({ description: 'Título da categoria', example: 'Estudos' })
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: string;

  @ApiProperty({ description: 'Data de última atualização' })
  updatedAt!: string;
}