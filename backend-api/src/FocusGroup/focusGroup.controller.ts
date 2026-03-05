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
import { FocusGroupService } from './focusGroup.service';
import { CreateFocusGroupDto } from './dto/crearFG.dto';
import { UpdateFocusGroupDto } from './dto/actualizarFG.dto';

@Controller('focus-group')
export class FocusGroupController {
    constructor(private readonly focusGroupService: FocusGroupService) { }

    @Post()
    create(@Body() createFocusGroupDto: CreateFocusGroupDto) {
        return this.focusGroupService.create(createFocusGroupDto);
    }

    @Get()
    findAll(
        @Query('proyectoId') proyectoId?: string,
        @Query('estado') estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado',
    ) {
        if (estado) {
            return this.focusGroupService.findByEstado(estado);
        }
        if (proyectoId) {
            return this.focusGroupService.findByProyecto(parseInt(proyectoId, 10));
        }
        return this.focusGroupService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.focusGroupService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateFocusGroupDto: UpdateFocusGroupDto,
    ) {
        return this.focusGroupService.update(id, updateFocusGroupDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.focusGroupService.remove(id);
    }
}