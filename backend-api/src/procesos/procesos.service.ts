import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proceso } from './entities/proceso.entity';
import { Subproceso } from './entities/subproceso.entity';
import { CreateProcesoDto } from './dto/create-proceso.dto';
import { UpdateProcesoDto } from './dto/update-proceso.dto';
import { CreateSubprocesoDto } from './dto/create-subproceso.dto';
import { UpdateSubprocesoDto } from './dto/update-subproceso.dto';

@Injectable()
export class ProcesosService {
  constructor(
    @InjectRepository(Proceso)
    private procesosRepository: Repository<Proceso>,
    @InjectRepository(Subproceso)
    private subprocesosRepository: Repository<Subproceso>,
  ) { }

  // ========== HELPER ==========

  private safeJsonParse(value: any, fallback: any[] = []): any[] {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  // ========== PROCESOS ==========

  /**
   * Crear un nuevo proceso
   */
  async createProceso(createProcesoDto: CreateProcesoDto): Promise<Proceso> {
    const { departamentos, pasos_clave, ...rest } = createProcesoDto;

    const procesoData: any = {
      ...rest,
    };

    if (departamentos) {
      procesoData.departamentos = JSON.stringify(departamentos);
    }

    if (pasos_clave) {
      procesoData.pasos_clave = JSON.stringify(pasos_clave);
    }

    const proceso = this.procesosRepository.create(procesoData);
    const saved = await this.procesosRepository.save(proceso);
    return saved as unknown as Proceso;
  }

  /**
   * Obtener todos los procesos de un proyecto (con subprocesos)
   */
  async findAllByProyecto(idProyecto: number): Promise<any[]> {
    const procesos = await this.procesosRepository.find({
      where: { id_proyecto: idProyecto },
      relations: ['subprocesos'],
      order: { id_proceso: 'ASC' },
    });

    return procesos.map((proceso) => ({
      id: proceso.id_proceso.toString(),
      nombre: proceso.nombre_proceso,
      descripcion: proceso.descripcion,
      color: proceso.color,
      stakeholder_id: proceso.id_stakeholder?.toString(),
      departamentos: this.safeJsonParse(proceso.departamentos),
      pasos_clave: this.safeJsonParse(proceso.pasos_clave),
      subprocesos: (proceso.subprocesos || []).map((sub) => ({
        id: sub.id_subproceso.toString(),
        nombre: sub.nombre_subproceso,
        descripcion: sub.descripcion,
        stakeholder_id: sub.id_stakeholder?.toString(),
      })),
    }));
  }

  /**
   * Obtener un proceso por ID (con subprocesos)
   */
  async findOneProceso(id: number): Promise<any> {
    const proceso = await this.procesosRepository.findOne({
      where: { id_proceso: id },
      relations: ['subprocesos'],
    });

    if (!proceso) {
      throw new NotFoundException(`Proceso con ID ${id} no encontrado`);
    }

    return {
      id: proceso.id_proceso.toString(),
      nombre: proceso.nombre_proceso,
      descripcion: proceso.descripcion,
      color: proceso.color,
      stakeholder_id: proceso.id_stakeholder?.toString(),
      departamentos: this.safeJsonParse(proceso.departamentos),
      pasos_clave: this.safeJsonParse(proceso.pasos_clave),
      subprocesos: (proceso.subprocesos || []).map((sub) => ({
        id: sub.id_subproceso.toString(),
        nombre: sub.nombre_subproceso,
        descripcion: sub.descripcion,
        stakeholder_id: sub.id_stakeholder?.toString(),
      })),
    };
  }

  /**
   * Actualizar un proceso
   */
  async updateProceso(
    id: number,
    updateProcesoDto: UpdateProcesoDto,
  ): Promise<Proceso> {
    await this.findOneProceso(id);

    const { departamentos, pasos_clave, ...rest } = updateProcesoDto;

    const updateData: any = { ...rest };

    if (departamentos !== undefined) {
      updateData.departamentos = JSON.stringify(departamentos);
    }

    if (pasos_clave !== undefined) {
      updateData.pasos_clave = JSON.stringify(pasos_clave);
    }

    await this.procesosRepository.update(id, updateData);
    const updated = await this.procesosRepository.findOne({ where: { id_proceso: id } });

    if (!updated) {
      throw new NotFoundException(`Proceso con ID ${id} no encontrado después de actualizar`);
    }

    return updated;
  }

  /**
   * Eliminar un proceso (y sus subprocesos en cascada)
   */
  async removeProceso(id: number): Promise<void> {
    const proceso = await this.procesosRepository.findOne({
      where: { id_proceso: id },
    });

    if (!proceso) {
      throw new NotFoundException(`Proceso con ID ${id} no encontrado`);
    }

    await this.procesosRepository.delete(id);
  }

  // ========== SUBPROCESOS ==========

  /**
   * Crear un nuevo subproceso
   */
  async createSubproceso(
    createSubprocesoDto: CreateSubprocesoDto,
  ): Promise<Subproceso> {
    const subproceso = this.subprocesosRepository.create(createSubprocesoDto);
    return await this.subprocesosRepository.save(subproceso);
  }

  /**
   * Obtener todos los subprocesos de un proceso
   */
  async findAllSubprocesosByProceso(
    idProceso: number,
  ): Promise<Subproceso[]> {
    return await this.subprocesosRepository.find({
      where: { id_proceso: idProceso },
      order: { id_subproceso: 'ASC' },
    });
  }

  /**
   * Obtener un subproceso por ID
   */
  async findOneSubproceso(id: number): Promise<Subproceso> {
    const subproceso = await this.subprocesosRepository.findOne({
      where: { id_subproceso: id },
    });

    if (!subproceso) {
      throw new NotFoundException(`Subproceso con ID ${id} no encontrado`);
    }

    return subproceso;
  }

  /**
   * Actualizar un subproceso
   */
  async updateSubproceso(
    id: number,
    updateSubprocesoDto: UpdateSubprocesoDto,
  ): Promise<Subproceso> {
    await this.findOneSubproceso(id);
    await this.subprocesosRepository.update(id, updateSubprocesoDto);

    const updated = await this.subprocesosRepository.findOne({
      where: { id_subproceso: id },
    });

    if (!updated) {
      throw new NotFoundException(`Subproceso con ID ${id} no encontrado después de actualizar`);
    }

    return updated;
  }

  /**
   * Eliminar un subproceso
   */
  async removeSubproceso(id: number): Promise<void> {
    const subproceso = await this.subprocesosRepository.findOne({
      where: { id_subproceso: id },
    });

    if (!subproceso) {
      throw new NotFoundException(`Subproceso con ID ${id} no encontrado`);
    }

    await this.subprocesosRepository.delete(id);
  }
}