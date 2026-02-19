import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateObservacionDto } from './dto/crearObservacion.dto';
import { UpdateObservacionDto } from './dto/actualizarObservacion.dto';
import { Observacion } from './entities/observaciones.entity';

@Injectable()
export class ObservacionesService {
    constructor(
        @InjectRepository(Observacion)
        private observacionesRepository: Repository<Observacion>,
    ) { }

    async create(createObservacionDto: CreateObservacionDto): Promise<Observacion> {
        const observacion = this.observacionesRepository.create(createObservacionDto);
        return await this.observacionesRepository.save(observacion);
    }

    async findAll(): Promise<Observacion[]> {
        return await this.observacionesRepository.find({
            order: { id_observacion: 'DESC' },
        });
    }

    async findByProyecto(idProyecto: number): Promise<Observacion[]> {
        return await this.observacionesRepository.find({
            where: { id_proyecto: idProyecto },
            order: { id_observacion: 'DESC' },
        });
    }

    async findByProceso(idProceso: number): Promise<Observacion[]> {
        return await this.observacionesRepository.find({
            where: { id_proceso: idProceso },
            order: { id_observacion: 'DESC' },
        });
    }

    async findBySubproceso(idSubproceso: number): Promise<Observacion[]> {
        return await this.observacionesRepository.find({
            where: { id_subproceso: idSubproceso },
            order: { id_observacion: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Observacion> {
        const observacion = await this.observacionesRepository.findOne({
            where: { id_observacion: id },
        });

        if (!observacion) {
            throw new NotFoundException(`Observación con ID ${id} no encontrada`);
        }

        return observacion;
    }

    async update(id: number, updateObservacionDto: UpdateObservacionDto): Promise<Observacion> {
        const observacion = await this.findOne(id);

        Object.assign(observacion, updateObservacionDto);

        return await this.observacionesRepository.save(observacion);
    }

    async remove(id: number): Promise<void> {
        const observacion = await this.findOne(id);
        await this.observacionesRepository.remove(observacion);
    }
}