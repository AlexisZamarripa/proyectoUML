import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum EstadoProyecto {
  PLANIFICACION = 'planificacion',
  EN_PROGRESO = 'en_progreso',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
}

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn()
  id_proyecto: number;

  @Column({ type: 'varchar', length: 150 })
  nombre_proyecto: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date;

  @Column({
    type: 'enum',
    enum: EstadoProyecto,
    default: EstadoProyecto.EN_PROGRESO,
  })
  estado: EstadoProyecto;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string;
}
