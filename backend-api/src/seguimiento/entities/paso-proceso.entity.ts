import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Seguimiento } from './seguimiento.entity';

@Entity('pasos_proceso')
export class PasoProceso {
  @PrimaryGeneratedColumn()
  id_paso: number;

  @Column({ type: 'int' })
  id_seguimiento: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre_paso: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duracion: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  responsable: string;

  @Column({ type: 'text', nullable: true })
  problemas_identificados: string;

  @Column({ type: 'text', nullable: true })
  metricas: string;

  @ManyToOne(() => Seguimiento, (seg) => seg.pasos)
  @JoinColumn({ name: 'id_seguimiento' })
  seguimiento?: Seguimiento;
}
