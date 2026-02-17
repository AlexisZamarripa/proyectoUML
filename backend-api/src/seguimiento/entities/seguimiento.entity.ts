import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PasoProceso } from './paso-proceso.entity';

@Entity('seguimiento')
export class Seguimiento {
  @PrimaryGeneratedColumn()
  id_seguimiento: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  titulo_seguimiento: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  id_transaccion: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre_proceso: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  proceso_vinculado: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  subproceso_nombre: string;

  @Column({ type: 'text', nullable: true })
  problemas_json: string; // JSON array of strings

  @Column({ type: 'text', nullable: true })
  metricas_json: string; // JSON array of {nombre, valor}

  @Column({ type: 'datetime', nullable: true })
  fecha_creacion: Date;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'int', nullable: true })
  id_proceso: number;

  @Column({ type: 'int', nullable: true })
  id_subproceso: number;

  @OneToMany(() => PasoProceso, (paso) => paso.seguimiento)
  pasos?: PasoProceso[];
}
