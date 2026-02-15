import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Proceso } from './proceso.entity';

@Entity('subprocesos')
export class Subproceso {
  @PrimaryGeneratedColumn()
  id_subproceso: number;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'int' })
  id_proceso: number;

  @Column({ type: 'int', nullable: true })
  id_stakeholder: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre_subproceso: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Proceso, (proceso) => proceso.subprocesos)
  @JoinColumn({ name: 'id_proceso' })
  proceso?: Proceso;
}
