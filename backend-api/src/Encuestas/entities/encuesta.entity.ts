import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PreguntaEncuesta } from './pregunta.entity';

@Entity('encuestas')
export class Encuesta {
    @PrimaryGeneratedColumn()
    id_encuesta: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    titulo_encuesta: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'int', nullable: true })
    numero_participantes_esperados: number;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'int' })
    id_proceso: number;

    @Column({ type: 'int' })
    id_subproceso: number;

    @OneToMany(() => PreguntaEncuesta, (pregunta) => pregunta.encuesta, {
        cascade: true,
        eager: true,
    })
    preguntas: PreguntaEncuesta[];
}