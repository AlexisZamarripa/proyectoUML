import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('historias_usuario')
export class HistoriaUsuario {
    @PrimaryGeneratedColumn()
    id_historia: number;

    @Column()
    id_proyecto: number;

    @Column({ nullable: true })
    id_proceso: number;

    @Column({ nullable: true })
    id_subproceso: number;

    @Column({ nullable: true })
    titulo_historia: string;

    @Column({ nullable: true })
    rol: string;

    @Column({ nullable: true })
    quiero: string;

    @Column({ nullable: true })
    para_que: string;

    @Column({
        type: 'enum',
        enum: ['baja', 'media', 'alta'],
        default: 'media',
        nullable: true,
    })
    prioridad: 'baja' | 'media' | 'alta';

    @Column({ nullable: true })
    estimacion: string;

    @Column({ type: 'text', nullable: true })
    criterios_aceptacion: string;
}