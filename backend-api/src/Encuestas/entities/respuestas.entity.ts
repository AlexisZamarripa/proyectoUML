import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PreguntaEncuesta } from './pregunta.entity';
import { Encuesta } from './encuesta.entity';

@Entity('respuestas_encuesta')
export class RespuestaEncuesta {
    @PrimaryGeneratedColumn()
    id_respuesta: number;

    @Column({ type: 'int' })
    id_pregunta: number;

    @Column({ type: 'int' })
    id_encuesta: number;

    @Column({ type: 'int' })
    id_subproceso: number;

    @Column({ type: 'text', nullable: true })
    respuesta: string;

    @CreateDateColumn()
    fecha_respuesta: Date;

    @ManyToOne(() => PreguntaEncuesta)
    @JoinColumn({ name: 'id_pregunta' })
    pregunta?: PreguntaEncuesta;
}