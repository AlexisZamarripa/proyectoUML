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
import { ProcesosService } from './procesos.service';
import { CreateProcesoDto } from './dto/create-proceso.dto';
import { UpdateProcesoDto } from './dto/update-proceso.dto';
import { CreateSubprocesoDto } from './dto/create-subproceso.dto';
import { UpdateSubprocesoDto } from './dto/update-subproceso.dto';

@Controller('procesos')
export class ProcesosController {
  constructor(private readonly procesosService: ProcesosService) {}

  // ========== PROCESOS ==========

  @Post()
  createProceso(@Body() createProcesoDto: CreateProcesoDto) {
    return this.procesosService.createProceso(createProcesoDto);
  }

  @Get('proyecto/:idProyecto')
  findAllByProyecto(@Param('idProyecto', ParseIntPipe) idProyecto: number) {
    return this.procesosService.findAllByProyecto(idProyecto);
  }

  @Get(':id')
  findOneProceso(@Param('id', ParseIntPipe) id: number) {
    return this.procesosService.findOneProceso(id);
  }

  @Patch(':id')
  updateProceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProcesoDto: UpdateProcesoDto,
  ) {
    return this.procesosService.updateProceso(id, updateProcesoDto);
  }

  @Delete(':id')
  removeProceso(@Param('id', ParseIntPipe) id: number) {
    return this.procesosService.removeProceso(id);
  }

  // ========== SUBPROCESOS ==========

  @Post('subprocesos')
  createSubproceso(@Body() createSubprocesoDto: CreateSubprocesoDto) {
    return this.procesosService.createSubproceso(createSubprocesoDto);
  }

  @Get(':idProceso/subprocesos')
  findAllSubprocesosByProceso(
    @Param('idProceso', ParseIntPipe) idProceso: number,
  ) {
    return this.procesosService.findAllSubprocesosByProceso(idProceso);
  }

  @Get('subprocesos/:id')
  findOneSubproceso(@Param('id', ParseIntPipe) id: number) {
    return this.procesosService.findOneSubproceso(id);
  }

  @Patch('subprocesos/:id')
  updateSubproceso(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubprocesoDto: UpdateSubprocesoDto,
  ) {
    return this.procesosService.updateSubproceso(id, updateSubprocesoDto);
  }

  @Delete('subprocesos/:id')
  removeSubproceso(@Param('id', ParseIntPipe) id: number) {
    return this.procesosService.removeSubproceso(id);
  }
}
