import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  /**
   * Crear un nuevo análisis de documentos
   * POST /documentos
   */
  @Post()
  create(@Body() createDocumentoDto: CreateDocumentoDto) {
    return this.documentosService.create(createDocumentoDto);
  }

  /**
   * Obtener todos los análisis de un proyecto
   * GET /documentos/proyecto/:idProyecto
   */
  @Get('proyecto/:idProyecto')
  findAllByProyecto(@Param('idProyecto', ParseIntPipe) idProyecto: number) {
    return this.documentosService.findAllByProyecto(idProyecto);
  }

  /**
   * Obtener un análisis por ID
   * GET /documentos/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentosService.findOne(id);
  }

  /**
   * Actualizar un análisis de documentos
   * PATCH /documentos/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
  ) {
    return this.documentosService.update(id, updateDocumentoDto);
  }

  /**
   * Eliminar un análisis de documentos
   * DELETE /documentos/:id
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentosService.remove(id);
  }
}
