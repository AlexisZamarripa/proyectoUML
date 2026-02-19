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
import { EntrevistasService } from './entrevista.service';
import { CreateEntrevistaDto } from './dto/crearEntrevista.dto';
import { UpdateEntrevistaDto } from './dto/actualizarEntrevista.dto';

@Controller('entrevistas')
export class EntrevistasController {
    constructor(private readonly entrevistasService: EntrevistasService) { }

    @Post()
    create(@Body() createEntrevistaDto: CreateEntrevistaDto) {
        return this.entrevistasService.create(createEntrevistaDto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('procesoId') procesoId?: string,
        @Query('subprocesoId') subprocesoId?: string,
    ) {
        if (subprocesoId) {
            return this.entrevistasService.findBySubproceso(parseInt(subprocesoId, 10));
        }
        if (procesoId) {
            return this.entrevistasService.findByProceso(parseInt(procesoId, 10));
        }
        if (proyectoId) {
            return this.entrevistasService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.entrevistasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.entrevistasService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEntrevistaDto: UpdateEntrevistaDto,
    ) {
        return this.entrevistasService.update(id, updateEntrevistaDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.entrevistasService.remove(id);
    }
}