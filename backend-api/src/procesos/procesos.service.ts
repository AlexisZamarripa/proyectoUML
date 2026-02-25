import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    private entityManager: EntityManager,
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

  // ========== HELPER HERRAMIENTA VINCULADA ==========

  private async getHerramientaDeSubproceso(
    idSubproceso: number,
  ): Promise<{ tipo: string; id: number; nombre: string } | null> {
    const tablas = [
      {
        tabla: 'subproceso_encuesta',
        campo: 'id_encuesta',
        nombreTabla: 'encuestas',
        campoNombre: 'titulo_encuesta',
        tipo: 'encuesta',
      },
      {
        tabla: 'subproceso_entrevista',
        campo: 'id_entrevista',
        nombreTabla: 'entrevistas',
        campoNombre: 'titulo_entrevista',
        tipo: 'entrevista',
      },
      {
        tabla: 'subproceso_documento',
        campo: 'id_documento',
        nombreTabla: 'documentos',
        campoNombre: 'titulo_analisis',
        tipo: 'documento',
      },
      {
        tabla: 'subproceso_focus',
        campo: 'id_focus',
        nombreTabla: 'focus_group',
        campoNombre: 'nombre_focus',
        tipo: 'focus_group',
      },
      {
        tabla: 'subproceso_historia',
        campo: 'id_historia',
        nombreTabla: 'historias_usuario',
        campoNombre: 'titulo_historia',
        tipo: 'historia_usuario',
      },
      {
        tabla: 'subproceso_observacion',
        campo: 'id_observacion',
        nombreTabla: 'observaciones',
        campoNombre: 'titulo',
        tipo: 'observacion',
      },
      {
        tabla: 'subproceso_seguimiento',
        campo: 'id_seguimiento',
        nombreTabla: 'seguimiento',
        campoNombre: 'titulo_seguimiento',
        tipo: 'seguimiento',
      },
    ];

    for (const t of tablas) {
      const rows = await this.entityManager.query(
        `SELECT v.\`${t.campo}\`, h.\`${t.campoNombre}\` as nombre
         FROM \`${t.tabla}\` v
         JOIN \`${t.nombreTabla}\` h ON h.\`${t.campo}\` = v.\`${t.campo}\`
         WHERE v.id_subproceso = ?
         LIMIT 1`,
        [idSubproceso],
      );
      if (rows.length > 0) {
        return {
          tipo: t.tipo,
          id: rows[0][t.campo],
          nombre: rows[0]['nombre'],
        };
      }
    }

    return null;
  }

  // ========== PROCESOS ==========

  /**
   * Crear un nuevo proceso
   */
  async createProceso(createProcesoDto: CreateProcesoDto): Promise<Proceso> {
    const { departamentos, pasos_clave, ...rest } = createProcesoDto;

    const procesoData: any = { ...rest };

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
   * Obtener todos los procesos de un proyecto (con subprocesos y herramienta vinculada)
   */
  async findAllByProyecto(idProyecto: number): Promise<any[]> {
    const procesos = await this.procesosRepository.find({
      where: { id_proyecto: idProyecto },
      relations: ['subprocesos'],
      order: { id_proceso: 'ASC' },
    });

    const result: any[] = [];

    for (const proceso of procesos) {
      const subprocesosConHerramienta = await Promise.all(
        (proceso.subprocesos || []).map(async (sub) => {
          const herramienta = await this.getHerramientaDeSubproceso(
            sub.id_subproceso,
          );
          return {
            id: sub.id_subproceso.toString(),
            nombre: sub.nombre_subproceso,
            descripcion: sub.descripcion,
            stakeholder_id: sub.id_stakeholder?.toString(),
            herramienta, // null si no tiene
          };
        }),
      );

      result.push({
        id: proceso.id_proceso.toString(),
        nombre: proceso.nombre_proceso,
        descripcion: proceso.descripcion,
        color: proceso.color,
        stakeholder_id: proceso.id_stakeholder?.toString(),
        departamentos: this.safeJsonParse(proceso.departamentos),
        pasos_clave: this.safeJsonParse(proceso.pasos_clave),
        subprocesos: subprocesosConHerramienta,
      });
    }

    return result;
  }

  /**
   * Obtener un proceso por ID (con subprocesos y herramienta vinculada)
   */
  async findOneProceso(id: number): Promise<any> {
    const proceso = await this.procesosRepository.findOne({
      where: { id_proceso: id },
      relations: ['subprocesos'],
    });

    if (!proceso) {
      throw new NotFoundException(`Proceso con ID ${id} no encontrado`);
    }

    const subprocesosConHerramienta = await Promise.all(
      (proceso.subprocesos || []).map(async (sub) => {
        const herramienta = await this.getHerramientaDeSubproceso(
          sub.id_subproceso,
        );
        return {
          id: sub.id_subproceso.toString(),
          nombre: sub.nombre_subproceso,
          descripcion: sub.descripcion,
          stakeholder_id: sub.id_stakeholder?.toString(),
          herramienta,
        };
      }),
    );

    return {
      id: proceso.id_proceso.toString(),
      nombre: proceso.nombre_proceso,
      descripcion: proceso.descripcion,
      color: proceso.color,
      stakeholder_id: proceso.id_stakeholder?.toString(),
      departamentos: this.safeJsonParse(proceso.departamentos),
      pasos_clave: this.safeJsonParse(proceso.pasos_clave),
      subprocesos: subprocesosConHerramienta,
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
    const updated = await this.procesosRepository.findOne({
      where: { id_proceso: id },
    });

    if (!updated) {
      throw new NotFoundException(
        `Proceso con ID ${id} no encontrado después de actualizar`,
      );
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
    const { tipo_herramienta, id_herramienta, ...subprocesoData } =
      createSubprocesoDto;

    // 1. Crear el subproceso normalmente
    const subproceso = this.subprocesosRepository.create(subprocesoData);
    const saved = await this.subprocesosRepository.save(subproceso);

    // 2. Si hay herramienta vinculada, insertar en la tabla correspondiente
    if (tipo_herramienta && id_herramienta) {
      const tablaVinculacion: Record<string, string> = {
        encuesta: 'subproceso_encuesta',
        entrevista: 'subproceso_entrevista',
        documento: 'subproceso_documento',
        focus_group: 'subproceso_focus',
        historia_usuario: 'subproceso_historia',
        observacion: 'subproceso_observacion',
        seguimiento: 'subproceso_seguimiento',
      };

      const campoId: Record<string, string> = {
        encuesta: 'id_encuesta',
        entrevista: 'id_entrevista',
        documento: 'id_documento',
        focus_group: 'id_focus',
        historia_usuario: 'id_historia',
        observacion: 'id_observacion',
        seguimiento: 'id_seguimiento',
      };

      const tabla = tablaVinculacion[tipo_herramienta];
      const campo = campoId[tipo_herramienta];

      if (tabla && campo) {
        try {
          await this.entityManager.query(
            `INSERT INTO \`${tabla}\` (id_proyecto, id_proceso, id_subproceso, \`${campo}\`) VALUES (?, ?, ?, ?)`,
            [
              saved.id_proyecto,
              saved.id_proceso,
              saved.id_subproceso,
              id_herramienta,
            ],
          );
          console.log('✅ Vinculado:', tabla, '| id_herramienta:', id_herramienta);
        } catch (e) {
          console.error('❌ Error al vincular:', e.message);
        }
      }
    }

    return saved;
  }

  /**
   * Obtener todos los subprocesos de un proceso
   */
  async findAllSubprocesosByProceso(idProceso: number): Promise<Subproceso[]> {
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
      throw new NotFoundException(
        `Subproceso con ID ${id} no encontrado después de actualizar`,
      );
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