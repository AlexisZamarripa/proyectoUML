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
    constructor(private readonly historiasService: HistoriasUsuarioService) { }

    @Post()
    create(@Body() dto: CreateHistoriaUsuarioDto) {
        return this.historiasService.create(dto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('procesoId') procesoId?: string,
        @Query('subprocesoId') subprocesoId?: string,
    ) {
        if (subprocesoId) {
            return this.historiasService.findBySubproceso(parseInt(subprocesoId, 10));
        }
        if (procesoId) {
            return this.historiasService.findByProceso(parseInt(procesoId, 10));
        }
        if (proyectoId) {
            return this.historiasService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.historiasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.historiasService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHistoriaUsuarioDto,
    ) {
        return this.historiasService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.historiasService.remove(id);
    }
}