import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('focus_group')
export class FocusGroup {
    @PrimaryGeneratedColumn()
    id_focus: number;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    nombre_focus: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'date', nullable: true })
    fecha_inicio: Date;

    @Column({ type: 'date', nullable: true })
    fecha_fin: Date;

    @Column({
        type: 'enum',
        enum: ['presencial', 'virtual', 'hibrido'],
        nullable: true,
    })
    modalidad: 'presencial' | 'virtual' | 'hibrido';

    @Column({ type: 'varchar', length: 200, nullable: true })
    lugar: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    moderador: string;

    @Column({ type: 'int', nullable: true })
    numero_participantes: number;

    @Column({
        type: 'enum',
        enum: ['planificacion', 'en_progreso', 'pausado', 'completado'],
        nullable: true,
    })
    estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

    @Column({ type: 'text', nullable: true })
    conclusiones: string;
}