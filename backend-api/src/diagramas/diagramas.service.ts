import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagrama } from './entities/diagrama.entity';
import { CreateDiagramaDto } from './dto/create-diagrama.dto';
import { UpdateDiagramaDto } from './dto/update-diagrama.dto';

@Injectable()
export class DiagramasService {
  constructor(
    @InjectRepository(Diagrama)
    private diagramasRepository: Repository<Diagrama>,
  ) {}

  async create(createDiagramaDto: CreateDiagramaDto): Promise<any> {
    const now = new Date();
    const entity = this.diagramasRepository.create({
      id_proyecto: createDiagramaDto.id_proyecto,
      nombre: createDiagramaDto.nombre.trim(),
      descripcion: createDiagramaDto.descripcion?.trim() ?? '',
      tipo: createDiagramaDto.tipo,
      nodes_json: JSON.stringify(createDiagramaDto.nodes ?? []),
      relations_json: JSON.stringify(createDiagramaDto.relations ?? []),
      messages_json: JSON.stringify(createDiagramaDto.messages ?? []),
      fragments_json: JSON.stringify(createDiagramaDto.fragments ?? []),
      creado_en: now,
      actualizado_en: now,
    });

    const saved = await this.diagramasRepository.save(entity);
    return this.mapToFrontend(saved);
  }

  async findAll(): Promise<any[]> {
    const items = await this.diagramasRepository.find({
      order: { actualizado_en: 'DESC' },
    });
    return items.map((item) => this.mapToFrontend(item));
  }

  async findByProyecto(idProyecto: number): Promise<any[]> {
    const items = await this.diagramasRepository.find({
      where: { id_proyecto: idProyecto },
      order: { actualizado_en: 'DESC' },
    });
    return items.map((item) => this.mapToFrontend(item));
  }

  async findOne(id: number): Promise<any> {
    const diagrama = await this.diagramasRepository.findOne({
      where: { id_diagrama: id },
    });

    if (!diagrama) {
      throw new NotFoundException(`Diagrama con ID ${id} no encontrado`);
    }

    return this.mapToFrontend(diagrama);
  }

  async update(id: number, updateDiagramaDto: UpdateDiagramaDto): Promise<any> {
    const existing = await this.diagramasRepository.findOne({
      where: { id_diagrama: id },
    });

    if (!existing) {
      throw new NotFoundException(`Diagrama con ID ${id} no encontrado`);
    }

    const updateData: Partial<Diagrama> = {
      actualizado_en: new Date(),
    };

    if (updateDiagramaDto.nombre !== undefined) {
      updateData.nombre = updateDiagramaDto.nombre.trim();
    }

    if (updateDiagramaDto.descripcion !== undefined) {
      updateData.descripcion = updateDiagramaDto.descripcion.trim();
    }

    if (updateDiagramaDto.tipo !== undefined) {
      updateData.tipo = updateDiagramaDto.tipo;
    }

    if (updateDiagramaDto.nodes !== undefined) {
      updateData.nodes_json = JSON.stringify(updateDiagramaDto.nodes);
    }

    if (updateDiagramaDto.relations !== undefined) {
      updateData.relations_json = JSON.stringify(updateDiagramaDto.relations);
    }

    if (updateDiagramaDto.messages !== undefined) {
      updateData.messages_json = JSON.stringify(updateDiagramaDto.messages);
    }

    if (updateDiagramaDto.fragments !== undefined) {
      updateData.fragments_json = JSON.stringify(updateDiagramaDto.fragments);
    }

    await this.diagramasRepository.update(id, updateData);
    const updated = await this.diagramasRepository.findOne({
      where: { id_diagrama: id },
    });

    if (!updated) {
      throw new NotFoundException(`Diagrama con ID ${id} no encontrado`);
    }

    return this.mapToFrontend(updated);
  }

  async remove(id: number): Promise<void> {
    const diagrama = await this.diagramasRepository.findOne({
      where: { id_diagrama: id },
    });

    if (!diagrama) {
      throw new NotFoundException(`Diagrama con ID ${id} no encontrado`);
    }

    await this.diagramasRepository.delete(id);
  }

  private mapToFrontend(diagrama: Diagrama): any {
    return {
      id: diagrama.id_diagrama.toString(),
      id_proyecto: diagrama.id_proyecto,
      nombre: diagrama.nombre ?? '',
      descripcion: diagrama.descripcion ?? '',
      tipo: diagrama.tipo,
      creadoEn: this.toIso(diagrama.creado_en),
      actualizadoEn: this.toIso(diagrama.actualizado_en),
      nodes: this.parseArray(diagrama.nodes_json),
      relations: this.parseArray(diagrama.relations_json),
      messages: this.parseArray(diagrama.messages_json),
      fragments: this.parseArray(diagrama.fragments_json),
    };
  }

  private parseArray(raw?: string | null): any[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private toIso(value: Date | string | null | undefined): string {
    if (!value) {
      return new Date().toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }
}
