import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UmlDiagramType = 'clases' | 'casos-uso' | 'secuencia' | 'paquetes';

export interface UmlMember {
  visibility: string;
  text: string;
}

export interface CanvasNode {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  icon?: string;
  badge?: string;
  stereotype?: string;
  noteText?: string;
  attributes?: UmlMember[];
  methods?: UmlMember[];
  width?: number;
  height?: number;
}

export interface UmlRelation {
  id: string;
  kind: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface SeqMessage {
  id: string;
  kind: string;
  sourceId: string;
  targetId: string;
  label: string;
  order: number;
}

export interface SeqFragment {
  id: string;
  kind: string;
  label: string;
  condition?: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  relations?: UmlRelation[];
  messages?: SeqMessage[];
  fragments?: SeqFragment[];
}

export interface CreateUmlDiagramDto {
  id_proyecto: number;
  nombre: string;
  descripcion?: string;
  tipo: UmlDiagramType;
  nodes?: CanvasNode[];
  relations?: UmlRelation[];
  messages?: SeqMessage[];
  fragments?: SeqFragment[];
}

export interface UpdateUmlDiagramDto {
  nombre?: string;
  descripcion?: string;
  tipo?: UmlDiagramType;
  nodes?: CanvasNode[];
  relations?: UmlRelation[];
  messages?: SeqMessage[];
  fragments?: SeqFragment[];
}

@Injectable({
  providedIn: 'root'
})
export class DiagramaApiService {
  private readonly baseUrl = 'http://localhost:3000/diagramas';

  constructor(private http: HttpClient) {}

  getByProyecto(idProyecto: number): Observable<UmlDiagram[]> {
    return this.http.get<UmlDiagram[]>(this.baseUrl, {
      params: { proyectoId: idProyecto.toString() }
    });
  }

  create(dto: CreateUmlDiagramDto): Observable<UmlDiagram> {
    return this.http.post<UmlDiagram>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateUmlDiagramDto): Observable<UmlDiagram> {
    return this.http.patch<UmlDiagram>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
