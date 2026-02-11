import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type EstadoProyecto = 'planificacion' | 'en-progreso' | 'pausado' | 'completado';

export interface ProyectoBackend {
  id_proyecto: number;
  nombre_proyecto: string;
  descripcion: string;
  fecha_inicio: string;
  estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';
  color: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  estado: EstadoProyecto;
  color: string;
  stakeholders: any[];
  procesos: any[];
}

export interface CreateProyectoRequest {
  nombre_proyecto: string;
  descripcion: string;
  fecha_inicio: string;
  estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectoApiService {
  private apiUrl = 'http://localhost:3000/proyectos';

  constructor(private http: HttpClient) {}

  /**
   * Convertir estado del frontend al formato del backend
   */
  private estadoToBackend(estado: EstadoProyecto): string {
    return estado.replace('-', '_');
  }

  /**
   * Convertir estado del backend al formato del frontend
   */
  private estadoFromBackend(estado: string): EstadoProyecto {
    return estado.replace('_', '-') as EstadoProyecto;
  }

  /**
   * Convertir proyecto del backend al formato del frontend
   */
  private mapToFrontend(proyecto: ProyectoBackend): Proyecto {
    return {
      id: proyecto.id_proyecto.toString(),
      nombre: proyecto.nombre_proyecto,
      descripcion: proyecto.descripcion,
      fechaInicio: proyecto.fecha_inicio,
      estado: this.estadoFromBackend(proyecto.estado),
      color: proyecto.color,
      stakeholders: [],
      procesos: []
    };
  }

  /**
   * Obtener todos los proyectos
   */
  getProyectos(): Observable<Proyecto[]> {
    return this.http.get<ProyectoBackend[]>(this.apiUrl).pipe(
      map(proyectos => proyectos.map(p => this.mapToFrontend(p)))
    );
  }

  /**
   * Obtener un proyecto por ID
   */
  getProyecto(id: string): Observable<Proyecto> {
    return this.http.get<ProyectoBackend>(`${this.apiUrl}/${id}`).pipe(
      map(p => this.mapToFrontend(p))
    );
  }

  /**
   * Crear un nuevo proyecto
   */
  createProyecto(proyecto: Omit<Proyecto, 'id' | 'stakeholders' | 'procesos'>): Observable<Proyecto> {
    const request: CreateProyectoRequest = {
      nombre_proyecto: proyecto.nombre,
      descripcion: proyecto.descripcion,
      fecha_inicio: proyecto.fechaInicio,
      estado: this.estadoToBackend(proyecto.estado) as any,
      color: proyecto.color
    };

    return this.http.post<ProyectoBackend>(this.apiUrl, request).pipe(
      map(p => this.mapToFrontend(p))
    );
  }

  /**
   * Actualizar un proyecto
   */
  updateProyecto(id: string, proyecto: Partial<Proyecto>): Observable<Proyecto> {
    const request: Partial<CreateProyectoRequest> = {};

    if (proyecto.nombre) request.nombre_proyecto = proyecto.nombre;
    if (proyecto.descripcion) request.descripcion = proyecto.descripcion;
    if (proyecto.fechaInicio) request.fecha_inicio = proyecto.fechaInicio;
    if (proyecto.estado) request.estado = this.estadoToBackend(proyecto.estado) as any;
    if (proyecto.color) request.color = proyecto.color;

    return this.http.patch<ProyectoBackend>(`${this.apiUrl}/${id}`, request).pipe(
      map(p => this.mapToFrontend(p))
    );
  }

  /**
   * Eliminar un proyecto
   */
  deleteProyecto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener estadísticas
   */
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
