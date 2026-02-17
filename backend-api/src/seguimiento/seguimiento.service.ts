import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seguimiento } from './entities/seguimiento.entity';
import { PasoProceso } from './entities/paso-proceso.entity';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from './dto/update-seguimiento.dto';

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectRepository(Seguimiento)
    private seguimientoRepository: Repository<Seguimiento>,
    @InjectRepository(PasoProceso)
    private pasosRepository: Repository<PasoProceso>,
  ) {}

  async create(createDto: CreateSeguimientoDto): Promise<any> {
    const { pasos, problemas, metricas, ...rest } = createDto;

    // Generar ID de transacción automáticamente si no se proporciona
    let idTransaccion = rest.idTransaccion;
    if (!idTransaccion) {
      const count = await this.seguimientoRepository.count({
        where: { id_proyecto: rest.id_proyecto },
      });
      const year = new Date().getFullYear();
      const numero = (count + 1).toString().padStart(4, '0');
      idTransaccion = `TXN-${year}-${numero}`;
    }

    const seguimientoData: any = {
      titulo_seguimiento: rest.titulo,
      id_transaccion: idTransaccion,
      nombre_proceso: rest.nombreProceso,
      proceso_vinculado: rest.procesoVinculado || null,
      subproceso_nombre: rest.subproceso || null,
      id_proyecto: rest.id_proyecto,
      id_proceso: rest.id_proceso || null,
      id_subproceso: rest.id_subproceso || null,
      fecha_creacion: new Date(),
    };

    if (problemas && problemas.length > 0) {
      seguimientoData.problemas_json = JSON.stringify(problemas);
    }

    if (metricas && metricas.length > 0) {
      seguimientoData.metricas_json = JSON.stringify(metricas);
    }

    const seguimiento = this.seguimientoRepository.create(seguimientoData as Partial<Seguimiento>);
    const saved = await this.seguimientoRepository.save(seguimiento) as unknown as Seguimiento;

    // Crear pasos asociados
    if (pasos && pasos.length > 0) {
      for (const paso of pasos) {
        const pasoEntity = this.pasosRepository.create({
          id_seguimiento: saved.id_seguimiento,
          nombre_paso: paso.nombre,
          duracion: paso.duracion || null,
          estado: paso.estado || 'pendiente',
        } as Partial<PasoProceso>);
        await this.pasosRepository.save(pasoEntity);
      }
    }

    // Recargar con pasos
    const result = await this.seguimientoRepository.findOne({
      where: { id_seguimiento: saved.id_seguimiento },
      relations: ['pasos'],
    });

    return this.mapToFrontend(result!);
  }

  async findAllByProyecto(idProyecto: number): Promise<any[]> {
    const seguimientos = await this.seguimientoRepository.find({
      where: { id_proyecto: idProyecto },
      relations: ['pasos'],
      order: { id_seguimiento: 'DESC' },
    });

    return seguimientos.map((seg) => this.mapToFrontend(seg));
  }

  async findOne(id: number): Promise<any> {
    const seguimiento = await this.seguimientoRepository.findOne({
      where: { id_seguimiento: id },
      relations: ['pasos'],
    });

    if (!seguimiento) {
      throw new NotFoundException(`Seguimiento con ID ${id} no encontrado`);
    }

    return this.mapToFrontend(seguimiento);
  }

  async update(id: number, updateDto: UpdateSeguimientoDto): Promise<any> {
    const existing = await this.seguimientoRepository.findOne({
      where: { id_seguimiento: id },
    });

    if (!existing) {
      throw new NotFoundException(`Seguimiento con ID ${id} no encontrado`);
    }

    const { pasos, problemas, metricas, ...rest } = updateDto;
    const updateData: any = {};

    if (rest.titulo !== undefined) updateData.titulo_seguimiento = rest.titulo;
    if (rest.idTransaccion !== undefined) updateData.id_transaccion = rest.idTransaccion;
    if (rest.nombreProceso !== undefined) updateData.nombre_proceso = rest.nombreProceso;
    if (rest.procesoVinculado !== undefined) updateData.proceso_vinculado = rest.procesoVinculado;
    if (rest.subproceso !== undefined) updateData.subproceso_nombre = rest.subproceso;
    if (rest.id_proceso !== undefined) updateData.id_proceso = rest.id_proceso;
    if (rest.id_subproceso !== undefined) updateData.id_subproceso = rest.id_subproceso;

    if (problemas !== undefined) {
      updateData.problemas_json = JSON.stringify(problemas);
    }

    if (metricas !== undefined) {
      updateData.metricas_json = JSON.stringify(metricas);
    }

    await this.seguimientoRepository.update(id, updateData);

    // Actualizar pasos si se proporcionan
    if (pasos !== undefined) {
      // Eliminar pasos anteriores
      await this.pasosRepository.delete({ id_seguimiento: id });

      // Crear nuevos pasos
      if (pasos.length > 0) {
        for (const paso of pasos) {
          const pasoEntity = this.pasosRepository.create({
            id_seguimiento: id,
            nombre_paso: paso.nombre,
            duracion: paso.duracion || null,
            estado: paso.estado || 'pendiente',
          } as Partial<PasoProceso>);
          await this.pasosRepository.save(pasoEntity);
        }
      }
    }

    const updated = await this.seguimientoRepository.findOne({
      where: { id_seguimiento: id },
      relations: ['pasos'],
    });

    if (!updated) {
      throw new NotFoundException(`Seguimiento con ID ${id} no encontrado después de actualizar`);
    }

    return this.mapToFrontend(updated);
  }

  async remove(id: number): Promise<void> {
    const seguimiento = await this.seguimientoRepository.findOne({
      where: { id_seguimiento: id },
    });

    if (!seguimiento) {
      throw new NotFoundException(`Seguimiento con ID ${id} no encontrado`);
    }

    // Los pasos se eliminan en cascada por la FK
    await this.seguimientoRepository.delete(id);
  }

  private mapToFrontend(seg: Seguimiento): any {
    let problemas: string[] = [];
    if (seg.problemas_json) {
      try {
        problemas = JSON.parse(seg.problemas_json);
      } catch {
        problemas = [];
      }
    }

    let metricas: { nombre: string; valor: string }[] = [];
    if (seg.metricas_json) {
      try {
        metricas = JSON.parse(seg.metricas_json);
      } catch {
        metricas = [];
      }
    }

    const pasos = (seg.pasos || []).map((paso) => ({
      nombre: paso.nombre_paso || '',
      duracion: paso.duracion || '',
      estado: paso.estado || 'pendiente',
    }));

    // Formatear fecha
    let fecha = '';
    if (seg.fecha_creacion) {
      const d = new Date(seg.fecha_creacion);
      fecha = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    return {
      id: seg.id_seguimiento.toString(),
      titulo: seg.titulo_seguimiento || '',
      fecha,
      idTransaccion: seg.id_transaccion || '',
      nombreProceso: seg.nombre_proceso || '',
      procesoVinculado: seg.proceso_vinculado || '',
      subproceso: seg.subproceso_nombre || '',
      id_proyecto: seg.id_proyecto,
      id_proceso: seg.id_proceso,
      id_subproceso: seg.id_subproceso,
      pasos,
      problemas,
      metricas,
    };
  }
}
