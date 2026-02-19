import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('observaciones')
export class Observacion {
    @PrimaryGeneratedColumn()
    id_observacion: number;

    @Column({ type: 'text', nullable: true })
    nota_rapida: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'text', nullable: true })
    hallazgos_puntos_clave: string;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'int' })
    id_proceso: number;

    @Column({ type: 'int' })
    id_subproceso: number;
}