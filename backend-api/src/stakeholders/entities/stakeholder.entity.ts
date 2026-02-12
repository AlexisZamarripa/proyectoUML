import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('stakeholders')
export class Stakeholder {
  @PrimaryGeneratedColumn()
  id_stakeholder: number;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'int', nullable: true, default: null })
  id_proceso: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  id_subproceso: number | null;

  @Column({ type: 'varchar', length: 150 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rol: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contacto: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @Column({ type: 'varchar', length: 30 })
  color: string;
}
