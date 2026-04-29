import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DiagramasService } from './diagramas.service';
import { CreateDiagramaDto } from './dto/create-diagrama.dto';
import { UpdateDiagramaDto } from './dto/update-diagrama.dto';

@Controller('diagramas')
export class DiagramasController {
  constructor(private readonly diagramasService: DiagramasService) {}

  @Post()
  create(@Body() createDiagramaDto: CreateDiagramaDto) {
    return this.diagramasService.create(createDiagramaDto);
  }

  @Get()
  findAll(@Query('proyectoId') proyectoId?: string) {
    if (proyectoId) {
      return this.diagramasService.findByProyecto(parseInt(proyectoId, 10));
    }
    return this.diagramasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.diagramasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiagramaDto: Record<string, unknown>,
  ) {
    return this.diagramasService.update(id, updateDiagramaDto as UpdateDiagramaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.diagramasService.remove(id);
  }
}
