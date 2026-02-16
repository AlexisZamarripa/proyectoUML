import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn()
  id_documento: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  titulo_analisis: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo_documento: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  fuente: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre_documento: string;

  @Column({ type: 'enum', enum: ['pdf', 'word', 'excel'], nullable: true })
  tipo_archivo: string;

  @Column({ type: 'text', nullable: true })
  url_ubicacion: string;

  @Column({ type: 'text', nullable: true })
  descripcion_documento: string;

  @Column({ type: 'text', nullable: true })
  documentos_json: string; // JSON array of {nombre, tipo, url, descripcion}

  @Column({ type: 'text', nullable: true })
  hallazgos: string; // JSON array of strings

  @Column({ type: 'text', nullable: true })
  recomendaciones: string;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'int' })
  id_proceso: number;

  @Column({ type: 'int' })
  id_subproceso: number;
}
