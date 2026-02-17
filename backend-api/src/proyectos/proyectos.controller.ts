import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  /**
   * POST /proyectos
   * Crear un nuevo proyecto
   */
  @Post()
  create(@Body() createProyectoDto: CreateProyectoDto) {
    return this.proyectosService.create(createProyectoDto);
  }

  /**
   * GET /proyectos
   * Obtener todos los proyectos
   */
  @Get()
  findAll() {
    return this.proyectosService.findAll();
  }

  /**
   * GET /proyectos/stats
   * Obtener estadísticas de proyectos
   */
  @Get('stats')
  getStats() {
    return this.proyectosService.getStats();
  }

  /**
   * GET /proyectos/:id
   * Obtener un proyecto por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.findOne(id);
  }

  /**
   * PATCH /proyectos/:id
   * Actualizar un proyecto
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProyectoDto: UpdateProyectoDto,
  ) {
    return this.proyectosService.update(id, updateProyectoDto);
  }

  /**
   * DELETE /proyectos/:id
   * Eliminar un proyecto
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.remove(id);
  }
}
