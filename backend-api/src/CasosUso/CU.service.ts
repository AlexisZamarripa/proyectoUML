import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHistoriaUsuarioDto } from './dto/crearCU.dto';
import { UpdateHistoriaUsuarioDto } from './dto/actualizarCU.dto';
import { HistoriaUsuario } from './entities/CU.entity';

@Injectable()
export class HistoriasUsuarioService {
    constructor(
        @InjectRepository(HistoriaUsuario)
        private historiasRepository: Repository<HistoriaUsuario>,
    ) { }

    async create(createHistoriaUsuarioDto: CreateHistoriaUsuarioDto): Promise<HistoriaUsuario> {
        const historia = this.historiasRepository.create(createHistoriaUsuarioDto);
        return await this.historiasRepository.save(historia);
    }

    async findAll(): Promise<HistoriaUsuario[]> {
        return await this.historiasRepository.find({
            order: { id_historia: 'DESC' },
        });
    }

    async findByProyecto(idProyecto: number): Promise<HistoriaUsuario[]> {
        return await this.historiasRepository.find({
            where: { id_proyecto: idProyecto },
            order: { id_historia: 'DESC' },
        });
    }

    async findByProceso(idProceso: number): Promise<HistoriaUsuario[]> {
        return await this.historiasRepository.find({
            where: { id_proceso: idProceso },
            order: { id_historia: 'DESC' },
        });
    }

    async findBySubproceso(idSubproceso: number): Promise<HistoriaUsuario[]> {
        return await this.historiasRepository.find({
            where: { id_subproceso: idSubproceso },
            order: { id_historia: 'DESC' },
        });
    }

    async findByPrioridad(prioridad: 'baja' | 'media' | 'alta'): Promise<HistoriaUsuario[]> {
        return await this.historiasRepository.find({
            where: { prioridad },
            order: { id_historia: 'DESC' },
        });
    }

    async findOne(id: number): Promise<HistoriaUsuario> {
        const historia = await this.historiasRepository.findOne({
            where: { id_historia: id },
        });

        if (!historia) {
            throw new NotFoundException(`Historia de Usuario con ID ${id} no encontrada`);
        }

        return historia;
    }

    async update(id: number, updateHistoriaUsuarioDto: UpdateHistoriaUsuarioDto): Promise<HistoriaUsuario> {
        const historia = await this.findOne(id);

        Object.assign(historia, updateHistoriaUsuarioDto);

        return await this.historiasRepository.save(historia);
    }

    async remove(id: number): Promise<void> {
        const historia = await this.findOne(id);
        await this.historiasRepository.remove(historia);
    }
}