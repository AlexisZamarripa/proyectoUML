import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEncuestaDto } from './dto/crearEncuesta.dto';
import { UpdateEncuestaDto } from './dto/actualizarEncuesta.dto';
import { Encuesta } from './entities/encuesta.entity';
import { PreguntaEncuesta } from './entities/pregunta.entity';
import { RespuestaEncuesta } from './entities/respuestas.entity';
import { CreateRespuestasDto } from './dto/respuestas.dto';

@Injectable()
export class EncuestasService {
    constructor(
        @InjectRepository(Encuesta)
        private encuestasRepository: Repository<Encuesta>,
        @InjectRepository(PreguntaEncuesta)
        private preguntasRepository: Repository<PreguntaEncuesta>,
        @InjectRepository(RespuestaEncuesta)
        private respuestasRepository: Repository<RespuestaEncuesta>,
    ) { }

    async create(createEncuestaDto: CreateEncuestaDto): Promise<Encuesta> {
        const { preguntas, ...encuestaData } = createEncuestaDto;

        // Crear la encuesta
        const encuesta = this.encuestasRepository.create(encuestaData);
        const encuestaGuardada = await this.encuestasRepository.save(encuesta);

        // Crear las preguntas si existen
        if (preguntas && preguntas.length > 0) {
            const preguntasEntidades = preguntas.map(p =>
                this.preguntasRepository.create({
                    id_encuesta: encuestaGuardada.id_encuesta,
                    pregunta: p.pregunta,
                    tipo_pregunta: p.tipo_pregunta || 'texto_abierto',
                })
            );
            await this.preguntasRepository.save(preguntasEntidades);
        }

        // Retornar la encuesta con las preguntas
        return this.findOne(encuestaGuardada.id_encuesta);
    }

    async findAll(): Promise<Encuesta[]> {
        return await this.encuestasRepository.find({
            relations: ['preguntas'],
            order: { id_encuesta: 'DESC' },
        });
    }

    async findByProyecto(idProyecto: number): Promise<Encuesta[]> {
        return await this.encuestasRepository.find({
            where: { id_proyecto: idProyecto },
            relations: ['preguntas'],
            order: { id_encuesta: 'DESC' },
        });
    }

    async findByProceso(idProceso: number): Promise<Encuesta[]> {
        return await this.encuestasRepository.find({
            where: { id_proceso: idProceso },
            relations: ['preguntas'],
            order: { id_encuesta: 'DESC' },
        });
    }

    async findBySubproceso(idSubproceso: number): Promise<Encuesta[]> {
        return await this.encuestasRepository.find({
            where: { id_subproceso: idSubproceso },
            relations: ['preguntas'],
            order: { id_encuesta: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Encuesta> {
        const encuesta = await this.encuestasRepository.findOne({
            where: { id_encuesta: id },
            relations: ['preguntas'],
        });

        if (!encuesta) {
            throw new NotFoundException(`Encuesta con ID ${id} no encontrada`);
        }

        return encuesta;
    }

    async update(id: number, updateEncuestaDto: UpdateEncuestaDto): Promise<Encuesta> {
        const encuesta = await this.findOne(id);
        const { preguntas, ...encuestaData } = updateEncuestaDto;

        // Actualizar datos de la encuesta
        Object.assign(encuesta, encuestaData);
        await this.encuestasRepository.save(encuesta);

        // Si se envían preguntas, eliminar las existentes y crear las nuevas
        if (preguntas) {
            await this.preguntasRepository.delete({ id_encuesta: id });

            if (preguntas.length > 0) {
                const preguntasEntidades = preguntas.map(p =>
                    this.preguntasRepository.create({
                        id_encuesta: id,
                        pregunta: p.pregunta,
                        tipo_pregunta: p.tipo_pregunta || 'texto_abierto',
                    })
                );
                await this.preguntasRepository.save(preguntasEntidades);
            }
        }

        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const encuesta = await this.findOne(id);
        await this.encuestasRepository.remove(encuesta);
    }

    // Método para guardar respuestas (reemplaza si ya existen para ese subproceso+encuesta)
    async saveRespuestas(dto: CreateRespuestasDto): Promise<RespuestaEncuesta[]> {
        // Eliminar respuestas previas del mismo subproceso para esta encuesta
        await this.respuestasRepository.delete({
            id_encuesta: dto.id_encuesta,
            id_subproceso: dto.id_subproceso,
        });

        // Guardar las nuevas
        const entidades = dto.respuestas.map(r =>
            this.respuestasRepository.create({
                id_pregunta: r.id_pregunta,
                id_encuesta: dto.id_encuesta,
                id_subproceso: dto.id_subproceso,
                respuesta: r.respuesta ?? '',
            })
        );

        return await this.respuestasRepository.save(entidades);
    }

    // Método para obtener respuestas de una encuesta en un subproceso específico
    async getRespuestas(idEncuesta: number, idSubproceso: number): Promise<RespuestaEncuesta[]> {
        return await this.respuestasRepository.find({
            where: {
                id_encuesta: idEncuesta,
                id_subproceso: idSubproceso,
            },
        });
    }
}