import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subproceso } from './subproceso.entity';

@Entity('procesos')
export class Proceso {
  @PrimaryGeneratedColumn()
  id_proceso: number;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'int', nullable: true })
  id_stakeholder: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre_proceso: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  departamentos: string; // JSON array de strings

  @Column({ type: 'text', nullable: true })
  pasos_clave: string; // JSON array de strings

  @OneToMany(() => Subproceso, (subproceso) => subproceso.proceso)
  subprocesos?: Subproceso[];
}
