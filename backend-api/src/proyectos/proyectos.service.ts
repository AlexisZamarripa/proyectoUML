import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectosRepository: Repository<Proyecto>,
  ) {}

  /**
   * Crear un nuevo proyecto
   */
  async create(createProyectoDto: CreateProyectoDto): Promise<Proyecto> {
    const proyecto = this.proyectosRepository.create(createProyectoDto);
    return await this.proyectosRepository.save(proyecto);
  }

  /**
   * Obtener todos los proyectos
   */
  async findAll(): Promise<Proyecto[]> {
    return await this.proyectosRepository.find({
      order: { id_proyecto: 'DESC' },
    });
  }

  /**
   * Obtener un proyecto por ID
   */
  async findOne(id: number): Promise<Proyecto> {
    const proyecto = await this.proyectosRepository.findOne({
      where: { id_proyecto: id },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return proyecto;
  }

  /**
   * Actualizar un proyecto
   */
  async update(
    id: number,
    updateProyectoDto: UpdateProyectoDto,
  ): Promise<Proyecto> {
    const proyecto = await this.findOne(id);

    Object.assign(proyecto, updateProyectoDto);

    return await this.proyectosRepository.save(proyecto);
  }

  /**
   * Eliminar un proyecto
   */
  async remove(id: number): Promise<void> {
    const proyecto = await this.findOne(id);
    await this.proyectosRepository.remove(proyecto);
  }

  /**
   * Obtener estadísticas de proyectos
   */
  async getStats() {
    const total = await this.proyectosRepository.count();
    const enProgreso = await this.proyectosRepository.count({
      where: { estado: 'en_progreso' as any },
    });
    const completados = await this.proyectosRepository.count({
      where: { estado: 'completado' as any },
    });
    const planificacion = await this.proyectosRepository.count({
      where: { estado: 'planificacion' as any },
    });
    const pausados = await this.proyectosRepository.count({
      where: { estado: 'pausado' as any },
    });

    return {
      total,
      enProgreso,
      completados,
      planificacion,
      pausados,
    };
  }
}
