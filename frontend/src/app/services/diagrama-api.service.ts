import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

export type UmlDiagramType = 'clases' | 'casos-uso' | 'secuencia' | 'paquetes';

export interface CanvasNode {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
}

export interface UmlDiagram {
  id: string;
  id_proyecto: number;
  nombre: string;
  descripcion: string;
  tipo: UmlDiagramType;
  creadoEn: string;
  actualizadoEn: string;
  nodes: CanvasNode[];
}

export interface CreateUmlDiagramDto {
  id_proyecto: number;
  nombre: string;
  descripcion?: string;
  tipo: UmlDiagramType;
  nodes?: CanvasNode[];
}

export interface UpdateUmlDiagramDto {
  nombre?: string;
  descripcion?: string;
  tipo?: UmlDiagramType;
  nodes?: CanvasNode[];
}

@Injectable({
  providedIn: 'root'
})
export class DiagramaApiService {
  private readonly storageKey = 'proyectoUML.uml.diagramas.v1';

  getByProyecto(idProyecto: number): Observable<UmlDiagram[]> {
    const diagramas = this.readStorage()
      .filter((item) => item.id_proyecto === idProyecto)
      .sort((a, b) => +new Date(b.actualizadoEn) - +new Date(a.actualizadoEn));

    return of(diagramas);
  }

  create(dto: CreateUmlDiagramDto): Observable<UmlDiagram> {
    const now = new Date().toISOString();

    const nuevoDiagrama: UmlDiagram = {
      id: this.buildId(),
      id_proyecto: dto.id_proyecto,
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() ?? '',
      tipo: dto.tipo,
      creadoEn: now,
      actualizadoEn: now,
      nodes: dto.nodes ? dto.nodes.map((node) => ({ ...node })) : [],
    };

    const current = this.readStorage();
    current.unshift(nuevoDiagrama);
    this.writeStorage(current);

    return of(nuevoDiagrama);
  }

  update(id: string, dto: UpdateUmlDiagramDto): Observable<UmlDiagram> {
    const current = this.readStorage();
    const index = current.findIndex((item) => item.id === id);

    if (index < 0) {
      return throwError(() => new Error('Diagrama no encontrado'));
    }

    const previous = current[index];
    const updated: UmlDiagram = {
      ...previous,
      nombre: dto.nombre !== undefined ? dto.nombre.trim() : previous.nombre,
      descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : previous.descripcion,
      tipo: dto.tipo ?? previous.tipo,
      actualizadoEn: new Date().toISOString(),
      nodes: dto.nodes ? dto.nodes.map((node) => ({ ...node })) : previous.nodes,
    };

    current[index] = updated;
    this.writeStorage(current);

    return of(updated);
  }

  delete(id: string): Observable<void> {
    const current = this.readStorage().filter((item) => item.id !== id);
    this.writeStorage(current);
    return of(void 0);
  }

  private readStorage(): UmlDiagram[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item): item is UmlDiagram => this.isUmlDiagram(item));
    } catch {
      return [];
    }
  }

  private writeStorage(diagramas: UmlDiagram[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(diagramas));
  }

  private isUmlDiagram(value: unknown): value is UmlDiagram {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<UmlDiagram>;

    return typeof candidate.id === 'string'
      && typeof candidate.id_proyecto === 'number'
      && typeof candidate.nombre === 'string'
      && typeof candidate.descripcion === 'string'
      && this.isUmlType(candidate.tipo)
      && typeof candidate.creadoEn === 'string'
      && typeof candidate.actualizadoEn === 'string'
      && Array.isArray(candidate.nodes)
      && candidate.nodes.every((node) => this.isCanvasNode(node));
  }

  private isCanvasNode(value: unknown): value is CanvasNode {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<CanvasNode>;

    return typeof candidate.id === 'string'
      && typeof candidate.kind === 'string'
      && typeof candidate.label === 'string'
      && typeof candidate.x === 'number'
      && typeof candidate.y === 'number';
  }

  private isUmlType(value: unknown): value is UmlDiagramType {
    return value === 'clases'
      || value === 'casos-uso'
      || value === 'secuencia'
      || value === 'paquetes';
  }

  private buildId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `dg-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }
}
