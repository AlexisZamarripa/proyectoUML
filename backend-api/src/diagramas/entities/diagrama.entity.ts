import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagramas')
export class Diagrama {
  @PrimaryGeneratedColumn()
  id_diagrama: number;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'varchar', length: 160 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 30 })
  tipo: string;

  @Column({ type: 'longtext', nullable: true })
  nodes_json: string;

  @Column({ type: 'longtext', nullable: true })
  relations_json: string;

  @Column({ type: 'longtext', nullable: true })
  messages_json: string;

  @Column({ type: 'longtext', nullable: true })
  fragments_json: string;

  @Column({ type: 'datetime' })
  creado_en: Date;

  @Column({ type: 'datetime' })
  actualizado_en: Date;
}
