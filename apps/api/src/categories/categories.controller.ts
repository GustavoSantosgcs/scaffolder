import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../access/access.decorators';
import { ProblemDetailsDto } from '../common/dto/problem-details.dto';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiCookieAuth('appstart_session')
@Controller('categories') // todos os endereços começam com /categories
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias ativas', description: 'Disponível para qualquer usuário autenticado.' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  findAll(): Promise<CategoryDto[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma categoria' })
  @ApiResponse({ status: 200, description: 'Dados da categoria', type: CategoryDto })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada', type: ProblemDetailsDto })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryDto> {
    return this.categoriesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar categoria (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Categoria criada', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos', type: ProblemDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN', type: ProblemDetailsDto })
  @ApiResponse({ status: 409, description: 'Título já existe', type: ProblemDetailsDto })
  create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar categoria (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos', type: ProblemDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN', type: ProblemDetailsDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada', type: ProblemDetailsDto })
  @ApiResponse({ status: 409, description: 'Título já existe', type: ProblemDetailsDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria (ADMIN)', description: 'Remoção lógica. As tarefas da categoria ficam sem categoria.' })
  @ApiResponse({ status: 204, description: 'Categoria excluída' })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN', type: ProblemDetailsDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada', type: ProblemDetailsDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}