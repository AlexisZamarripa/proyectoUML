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
import { EncuestasService } from './encuestas.service';
import { CreateEncuestaDto } from './dto/crearEncuesta.dto';
import { UpdateEncuestaDto } from './dto/actualizarEncuesta.dto';
import { CreateRespuestasDto } from './dto/respuestas.dto';

@Controller('encuestas')
export class EncuestasController {
    constructor(private readonly encuestasService: EncuestasService) { }

    @Post('respuestas')
    saveRespuestas(@Body() dto: CreateRespuestasDto) {
        return this.encuestasService.saveRespuestas(dto);
    }

    @Post()
    create(@Body() createEncuestaDto: CreateEncuestaDto) {
        return this.encuestasService.create(createEncuestaDto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('procesoId') procesoId?: string,
        @Query('subprocesoId') subprocesoId?: string,
    ) {
        if (subprocesoId) {
            return this.encuestasService.findBySubproceso(parseInt(subprocesoId, 10));
        }
        if (procesoId) {
            return this.encuestasService.findByProceso(parseInt(procesoId, 10));
        }
        if (proyectoId) {
            return this.encuestasService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.encuestasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.encuestasService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEncuestaDto: UpdateEncuestaDto,
    ) {
        return this.encuestasService.update(id, updateEncuestaDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.encuestasService.remove(id);
    }

    // Obtener respuestas de una encuesta para un subproceso
    @Get(':id/respuestas/:idSubproceso')
    getRespuestas(
        @Param('id', ParseIntPipe) id: number,
        @Param('idSubproceso', ParseIntPipe) idSubproceso: number,
    ) {
        return this.encuestasService.getRespuestas(id, idSubproceso);
    }
}