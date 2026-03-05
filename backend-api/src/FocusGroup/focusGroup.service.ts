import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFocusGroupDto } from './dto/crearFG.dto';
import { UpdateFocusGroupDto } from './dto/actualizarFG.dto';
import { FocusGroup } from './entities/FG.entity';

@Injectable()
export class FocusGroupService {
    constructor(
        @InjectRepository(FocusGroup)
        private focusGroupRepository: Repository<FocusGroup>,
    ) { }

    async create(createFocusGroupDto: CreateFocusGroupDto): Promise<FocusGroup> {
        const focusGroup = this.focusGroupRepository.create(createFocusGroupDto);
        return await this.focusGroupRepository.save(focusGroup);
    }

    async findAll(): Promise<FocusGroup[]> {
        return await this.focusGroupRepository.find({
            order: { id_focus: 'DESC' },
        });
    }

    async findByProyecto(idProyecto: number): Promise<FocusGroup[]> {
        return await this.focusGroupRepository.find({
            where: { id_proyecto: idProyecto },
            order: { id_focus: 'DESC' },
        });
    }

    async findByEstado(estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado'): Promise<FocusGroup[]> {
        return await this.focusGroupRepository.find({
            where: { estado },
            order: { id_focus: 'DESC' },
        });
    }

    async findOne(id: number): Promise<FocusGroup> {
        const focusGroup = await this.focusGroupRepository.findOne({
            where: { id_focus: id },
        });

        if (!focusGroup) {
            throw new NotFoundException(`Focus Group con ID ${id} no encontrado`);
        }

        return focusGroup;
    }

    async update(id: number, updateFocusGroupDto: UpdateFocusGroupDto): Promise<FocusGroup> {
        const focusGroup = await this.findOne(id);
        Object.assign(focusGroup, updateFocusGroupDto);
        return await this.focusGroupRepository.save(focusGroup);
    }

    async remove(id: number): Promise<void> {
        const focusGroup = await this.findOne(id);
        await this.focusGroupRepository.remove(focusGroup);
    }
}