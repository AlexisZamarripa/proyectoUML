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
import { ObservacionesService } from './observaciones.service';
import { CreateObservacionDto } from './dto/crearObservacion.dto';
import { UpdateObservacionDto } from './dto/actualizarObservacion.dto';

@Controller('observaciones')
export class ObservacionesController {
    constructor(private readonly observacionesService: ObservacionesService) { }

    @Post()
    create(@Body() createObservacionDto: CreateObservacionDto) {
        return this.observacionesService.create(createObservacionDto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('procesoId') procesoId?: string,
        @Query('subprocesoId') subprocesoId?: string,
    ) {
        if (subprocesoId) {
            return this.observacionesService.findBySubproceso(parseInt(subprocesoId, 10));
        }
        if (procesoId) {
            return this.observacionesService.findByProceso(parseInt(procesoId, 10));
        }
        if (proyectoId) {
            return this.observacionesService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.observacionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.observacionesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateObservacionDto: UpdateObservacionDto,
    ) {
        return this.observacionesService.update(id, updateObservacionDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.observacionesService.remove(id);
    }
}   