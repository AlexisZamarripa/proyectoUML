import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './entities/documento.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private documentosRepository: Repository<Documento>,
  ) {}

  /**
   * Crear un nuevo análisis de documentos
   */
  async create(createDocumentoDto: CreateDocumentoDto): Promise<any> {
    const { documentos, hallazgos, ...rest } = createDocumentoDto;

    const documentoData: any = {
      ...rest,
    };

    // Almacenar array de documentos como JSON
    if (documentos && documentos.length > 0) {
      documentoData.documentos_json = JSON.stringify(documentos);
      // Guardar el primer documento en los campos individuales por compatibilidad
      documentoData.nombre_documento = documentos[0].nombre || null;
      documentoData.tipo_archivo = documentos[0].tipo || null;
      documentoData.url_ubicacion = documentos[0].url || null;
      documentoData.descripcion_documento = documentos[0].descripcion || null;
    }

    // Almacenar hallazgos como JSON
    if (hallazgos && hallazgos.length > 0) {
      documentoData.hallazgos = JSON.stringify(hallazgos);
    }

    const documento = this.documentosRepository.create(documentoData);
    const saved = await this.documentosRepository.save(documento);

    return this.mapToFrontend(saved as unknown as Documento);
  }

  /**
   * Obtener todos los análisis de documentos de un proyecto
   */
  async findAllByProyecto(idProyecto: number): Promise<any[]> {
    const documentos = await this.documentosRepository.find({
      where: { id_proyecto: idProyecto },
      order: { id_documento: 'DESC' },
    });

    return documentos.map((doc) => this.mapToFrontend(doc));
  }

  /**
   * Obtener un análisis por ID
   */
  async findOne(id: number): Promise<any> {
    const documento = await this.documentosRepository.findOne({
      where: { id_documento: id },
    });

    if (!documento) {
      throw new NotFoundException(
        `Análisis de documento con ID ${id} no encontrado`,
      );
    }

    return this.mapToFrontend(documento);
  }

  /**
   * Actualizar un análisis de documentos
   */
  async update(id: number, updateDocumentoDto: UpdateDocumentoDto): Promise<any> {
    const existing = await this.documentosRepository.findOne({
      where: { id_documento: id },
    });

    if (!existing) {
      throw new NotFoundException(
        `Análisis de documento con ID ${id} no encontrado`,
      );
    }

    const { documentos, hallazgos, ...rest } = updateDocumentoDto;
    const updateData: any = { ...rest };

    if (documentos !== undefined) {
      updateData.documentos_json = JSON.stringify(documentos);
      if (documentos.length > 0) {
        updateData.nombre_documento = documentos[0].nombre || null;
        updateData.tipo_archivo = documentos[0].tipo || null;
        updateData.url_ubicacion = documentos[0].url || null;
        updateData.descripcion_documento = documentos[0].descripcion || null;
      }
    }

    if (hallazgos !== undefined) {
      updateData.hallazgos = JSON.stringify(hallazgos);
    }

    await this.documentosRepository.update(id, updateData);

    const updated = await this.documentosRepository.findOne({
      where: { id_documento: id },
    });

    if (!updated) {
      throw new NotFoundException(
        `Análisis de documento con ID ${id} no encontrado después de actualizar`,
      );
    }

    return this.mapToFrontend(updated);
  }

  /**
   * Eliminar un análisis de documentos
   */
  async remove(id: number): Promise<void> {
    const documento = await this.documentosRepository.findOne({
      where: { id_documento: id },
    });

    if (!documento) {
      throw new NotFoundException(
        `Análisis de documento con ID ${id} no encontrado`,
      );
    }

    await this.documentosRepository.delete(id);
  }

  /**
   * Mapear entidad a formato frontend
   */
  private mapToFrontend(doc: Documento): any {
    let documentos: any[] = [];
    if (doc.documentos_json) {
      try {
        documentos = JSON.parse(doc.documentos_json);
      } catch {
        documentos = [];
      }
    }

    let hallazgos: string[] = [];
    if (doc.hallazgos) {
      try {
        hallazgos = JSON.parse(doc.hallazgos);
      } catch {
        hallazgos = doc.hallazgos ? [doc.hallazgos] : [];
      }
    }

    return {
      id: doc.id_documento.toString(),
      titulo: doc.titulo_analisis,
      tipoDocumento: doc.tipo_documento,
      fuente: doc.fuente || '',
      proceso: doc.id_proceso,
      subproceso: doc.id_subproceso,
      id_proyecto: doc.id_proyecto,
      id_proceso: doc.id_proceso,
      id_subproceso: doc.id_subproceso,
      documentos,
      hallazgos,
      recomendaciones: doc.recomendaciones || '',
    };
  }


}
