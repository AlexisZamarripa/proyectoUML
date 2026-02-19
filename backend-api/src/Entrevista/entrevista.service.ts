import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEntrevistaDto } from './dto/crearEntrevista.dto';
import { UpdateEntrevistaDto } from './dto/actualizarEntrevista.dto';
import { Entrevista } from './entities/entrevista.entity';
import { PreguntaEntrevista } from './entities/pregunta-entrevista.entity';

@Injectable()
export class EntrevistasService {
    constructor(
        @InjectRepository(Entrevista)
        private entrevistasRepository: Repository<Entrevista>,
        @InjectRepository(PreguntaEntrevista)
        private preguntasRepository: Repository<PreguntaEntrevista>,
    ) { }

    async create(createEntrevistaDto: CreateEntrevistaDto): Promise<Entrevista> {
        const { preguntas, ...entrevistaData } = createEntrevistaDto;

        // Crear la entrevista
        const entrevista = this.entrevistasRepository.create(entrevistaData);
        const entrevistaGuardada = await this.entrevistasRepository.save(entrevista);

        // Crear las preguntas si existen
        if (preguntas && preguntas.length > 0) {
            const preguntasEntidades = preguntas.map(p =>
                this.preguntasRepository.create({
                    id_entrevista: entrevistaGuardada.id_entrevista,
                    pregunta: p.pregunta,
                })
            );
            await this.preguntasRepository.save(preguntasEntidades);
        }

        // Retornar la entrevista con las preguntas
        return this.findOne(entrevistaGuardada.id_entrevista);
    }

    async findAll(): Promise<Entrevista[]> {
        return await this.entrevistasRepository.find({
            relations: ['preguntas'],
            order: { id_entrevista: 'DESC' },
        });
    }

    async findByProyecto(idProyecto: number): Promise<Entrevista[]> {
        return await this.entrevistasRepository.find({
            where: { id_proyecto: idProyecto },
            relations: ['preguntas'],
            order: { id_entrevista: 'DESC' },
        });
    }

    async findByProceso(idProceso: number): Promise<Entrevista[]> {
        return await this.entrevistasRepository.find({
            where: { id_proceso: idProceso },
            relations: ['preguntas'],
            order: { id_entrevista: 'DESC' },
        });
    }

    async findBySubproceso(idSubproceso: number): Promise<Entrevista[]> {
        return await this.entrevistasRepository.find({
            where: { id_subproceso: idSubproceso },
            relations: ['preguntas'],
            order: { id_entrevista: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Entrevista> {
        const entrevista = await this.entrevistasRepository.findOne({
            where: { id_entrevista: id },
            relations: ['preguntas'],
        });

        if (!entrevista) {
            throw new NotFoundException(`Entrevista con ID ${id} no encontrada`);
        }

        return entrevista;
    }

    async update(id: number, updateEntrevistaDto: UpdateEntrevistaDto): Promise<Entrevista> {
        const entrevista = await this.findOne(id);
        const { preguntas, ...entrevistaData } = updateEntrevistaDto;

        // Actualizar datos de la entrevista
        Object.assign(entrevista, entrevistaData);
        await this.entrevistasRepository.save(entrevista);

        // Si se envían preguntas, eliminar las existentes y crear las nuevas
        if (preguntas) {
            await this.preguntasRepository.delete({ id_entrevista: id });

            if (preguntas.length > 0) {
                const preguntasEntidades = preguntas.map(p =>
                    this.preguntasRepository.create({
                        id_entrevista: id,
                        pregunta: p.pregunta,
                    })
                );
                await this.preguntasRepository.save(preguntasEntidades);
            }
        }

        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const entrevista = await this.findOne(id);
        await this.entrevistasRepository.remove(entrevista);
    }
}