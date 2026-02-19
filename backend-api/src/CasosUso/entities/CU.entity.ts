import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('historias_usuario')
export class HistoriaUsuario {
    @PrimaryGeneratedColumn()
    id_historia: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    titulo_historia: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    rol: string;

    @Column({ type: 'text', nullable: true })
    quiero: string;

    @Column({ type: 'text', nullable: true })
    para_que: string;

    @Column({
        type: 'enum',
        enum: ['baja', 'media', 'alta'],
        nullable: true,
    })
    prioridad: 'baja' | 'media' | 'alta';

    @Column({ type: 'varchar', length: 20, nullable: true })
    estimacion: string;

    @Column({ type: 'text', nullable: true })
    criterios_aceptacion: string;

    @Column({ type: 'int' })
    id_proyecto: number;

    @Column({ type: 'int' })
    id_proceso: number;

    @Column({ type: 'int' })
    id_subproceso: number;
}