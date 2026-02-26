import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PreguntaEntrevista } from './pregunta-entrevista.entity';

@Entity('entrevistas')
export class Entrevista {
    @PrimaryGeneratedColumn()
    id_entrevista: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    titulo_entrevista: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    entrevistador: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    entrevistado: string;

    @Column({ type: 'text', nullable: true })
    notas_contexto: string;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'int', nullable: true })
    id_proceso: number | null;

    @Column({ type: 'int', nullable: true })
    id_subproceso: number | null;

    @OneToMany(() => PreguntaEntrevista, (pregunta) => pregunta.entrevista, {
        cascade: true,
        eager: true,
    })
    preguntas: PreguntaEntrevista[];
}