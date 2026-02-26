import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subproceso {
  id: string;
  nombre: string;
  descripcion: string;
  stakeholder_id?: string;
  herramienta?: {
    id: number;      // ← AGREGAR ESTO
    tipo: string;
    nombre: string;
  };
}

export interface Proceso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  stakeholder_id?: string;
  departamentos: string[];
  pasos_clave: string[];
  subprocesos: Subproceso[];
}

export interface CreateProcesoDto {
  id_proyecto: number;
  id_stakeholder?: number | null;
  nombre_proceso: string;
  descripcion?: string;
  color?: string;
  departamentos?: string[];
  pasos_clave?: string[];
}

export interface UpdateProcesoDto {
  id_stakeholder?: number | null;
  nombre_proceso?: string;
  descripcion?: string;
  color?: string;
  departamentos?: string[];
  pasos_clave?: string[];
}

export interface CreateSubprocesoDto {
  id_proyecto: number;
  id_proceso: number;
  id_stakeholder?: number | null;
  nombre_subproceso: string;
  descripcion?: string;
  tipo_herramienta?: string | null;
  id_herramienta?: number | null;
}

export interface UpdateSubprocesoDto {
  id_stakeholder?: number | null;
  nombre_subproceso?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcesoApiService {
  private apiUrl = 'http://localhost:3000/procesos';

  constructor(private http: HttpClient) { }

  // ========== PROCESOS ==========

  /**
   * Crear un nuevo proceso
   */
  createProceso(createProcesoDto: CreateProcesoDto): Observable<Proceso> {
    return this.http.post<Proceso>(this.apiUrl, createProcesoDto);
  }

  /**
   * Obtener todos los procesos de un proyecto
   */
  getProcesosByProyecto(idProyecto: number): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(`${this.apiUrl}/proyecto/${idProyecto}`);
  }

  /**
   * Obtener un proceso por ID
   */
  getProceso(id: number): Observable<Proceso> {
    return this.http.get<Proceso>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar un proceso
   */
  updateProceso(id: number, updateProcesoDto: UpdateProcesoDto): Observable<Proceso> {
    return this.http.patch<Proceso>(`${this.apiUrl}/${id}`, updateProcesoDto);
  }

  /**
   * Eliminar un proceso
   */
  deleteProceso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== SUBPROCESOS ==========

  /**
   * Crear un nuevo subproceso
   */
  createSubproceso(createSubprocesoDto: CreateSubprocesoDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/subprocesos`, createSubprocesoDto);
  }

  /**
   * Obtener todos los subprocesos de un proceso
   */
  getSubprocesosByProceso(idProceso: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idProceso}/subprocesos`);
  }

  /**
   * Obtener un subproceso por ID
   */
  getSubproceso(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subprocesos/${id}`);
  }

  /**
   * Actualizar un subproceso
   */
  updateSubproceso(id: number, updateSubprocesoDto: UpdateSubprocesoDto): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/subprocesos/${id}`, updateSubprocesoDto);
  }

  /**
   * Eliminar un subproceso
   */
  deleteSubproceso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subprocesos/${id}`);
  }
}
