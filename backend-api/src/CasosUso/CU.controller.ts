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
import { HistoriasUsuarioService } from './CU.service';
import { CreateHistoriaUsuarioDto } from './dto/crearCU.dto';
import { UpdateHistoriaUsuarioDto } from './dto/actualizarCU.dto';

@Controller('historias-usuario')
export class HistoriasUsuarioController {
    constructor(private readonly historiasUsuarioService: HistoriasUsuarioService) { }

    @Post()
    create(@Body() createHistoriaUsuarioDto: CreateHistoriaUsuarioDto) {
        return this.historiasUsuarioService.create(createHistoriaUsuarioDto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('procesoId') procesoId?: string,
        @Query('subprocesoId') subprocesoId?: string,
        @Query('prioridad') prioridad?: 'baja' | 'media' | 'alta',
    ) {
        if (prioridad) {
            return this.historiasUsuarioService.findByPrioridad(prioridad);
        }
        if (subprocesoId) {
            return this.historiasUsuarioService.findBySubproceso(parseInt(subprocesoId, 10));
        }
        if (procesoId) {
            return this.historiasUsuarioService.findByProceso(parseInt(procesoId, 10));
        }
        if (proyectoId) {
            return this.historiasUsuarioService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.historiasUsuarioService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.historiasUsuarioService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateHistoriaUsuarioDto: UpdateHistoriaUsuarioDto,
    ) {
        return this.historiasUsuarioService.update(id, updateHistoriaUsuarioDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.historiasUsuarioService.remove(id);
    }
}