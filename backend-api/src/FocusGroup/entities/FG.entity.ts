import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('focus_group')
export class FocusGroup {
    @PrimaryGeneratedColumn()
    id_focus: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    nombre_focus: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'date', nullable: true })
    fecha_inicio: Date;

    @Column({
        type: 'enum',
        enum: ['planificacion', 'en_progreso', 'pausado', 'completado'],
        nullable: true,
    })
    estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

    @Column({ type: 'varchar', length: 30, nullable: true })
    color: string;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'int' })
    id_proceso: number;

    @Column({ type: 'int' })
    id_subproceso: number;
}