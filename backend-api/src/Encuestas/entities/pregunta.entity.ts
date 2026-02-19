import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Encuesta } from './encuesta.entity';

@Entity('preguntas_encuesta')
export class PreguntaEncuesta {
    @PrimaryGeneratedColumn()
    id_pregunta: number;

    @Column({ type: 'int' })
    id_encuesta: number;

    @Column({ type: 'text', nullable: true })
    pregunta: string;

    @Column({
        type: 'enum',
        enum: ['texto_abierto', 'opcion_multiple', 'escala', 'si_no'],
        nullable: true,
    })
    tipo_pregunta: 'texto_abierto' | 'opcion_multiple' | 'escala' | 'si_no';

    @ManyToOne(() => Encuesta, (encuesta) => encuesta.preguntas, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'id_encuesta' })
    encuesta: Encuesta;
}