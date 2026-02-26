import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Entrevista } from './entrevista.entity';

@Entity('preguntas_entrevista')
export class PreguntaEntrevista {
    @PrimaryGeneratedColumn()
    id_pregunta: number;

    @Column({ type: 'int' })
    id_entrevista: number;

    @Column({ type: 'text', nullable: true })
    pregunta: string;

    @Column({ type: 'text', nullable: true })
    respuesta: string | null;

    @ManyToOne(() => Entrevista, (entrevista) => entrevista.preguntas, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'id_entrevista' })
    entrevista: Entrevista;
}