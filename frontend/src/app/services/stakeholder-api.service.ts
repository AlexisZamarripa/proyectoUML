import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StakeholderBackend {
  id_stakeholder: number;
  id_proyecto: number;
  id_proceso?: number;
  id_subproceso?: number;
  nombre_completo: string;
  rol: string;
  area: string;
  contacto: string;
  notas?: string;
  color: string;
}

export interface Stakeholder {
  id: string;
  idProyecto: string;
  nombre: string;
  rol: string;
  area: string;
  contacto: string;
  notas: string;
  color: string;
}

export interface CreateStakeholderRequest {
  id_proyecto: number;
  nombre_completo: string;
  rol: string;
  area: string;
  contacto: string;
  notas?: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class StakeholderApiService {
  private apiUrl = 'http://localhost:3000/stakeholders';

  constructor(private http: HttpClient) {}

  /**
   * Convertir stakeholder del backend al formato del frontend
   */
  private mapToFrontend(stakeholder: StakeholderBackend): Stakeholder {
    return {
      id: stakeholder.id_stakeholder.toString(),
      idProyecto: stakeholder.id_proyecto.toString(),
      nombre: stakeholder.nombre_completo,
      rol: stakeholder.rol,
      area: stakeholder.area,
      contacto: stakeholder.contacto,
      notas: stakeholder.notas || '',
      color: stakeholder.color
    };
  }

  /**
   * Obtener todos los stakeholders o filtrar por proyecto
   */
  getStakeholders(proyectoId?: string): Observable<Stakeholder[]> {
    const url = proyectoId 
      ? `${this.apiUrl}?proyectoId=${proyectoId}` 
      : this.apiUrl;
    
    return new Observable(observer => {
      this.http.get<StakeholderBackend[]>(url).subscribe({
        next: (stakeholders) => {
          observer.next(stakeholders.map(s => this.mapToFrontend(s)));
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtener un stakeholder por ID
   */
  getStakeholder(id: string): Observable<Stakeholder> {
    return new Observable(observer => {
      this.http.get<StakeholderBackend>(`${this.apiUrl}/${id}`).subscribe({
        next: (stakeholder) => {
          observer.next(this.mapToFrontend(stakeholder));
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Crear un nuevo stakeholder
   */
  createStakeholder(
    proyectoId: string, 
    stakeholder: Omit<Stakeholder, 'id' | 'idProyecto'>
  ): Observable<Stakeholder> {
    const request: CreateStakeholderRequest = {
      id_proyecto: parseInt(proyectoId, 10),
      nombre_completo: stakeholder.nombre,
      rol: stakeholder.rol,
      area: stakeholder.area,
      contacto: stakeholder.contacto,
      notas: stakeholder.notas || undefined,
      color: stakeholder.color
    };

    return new Observable(observer => {
      this.http.post<StakeholderBackend>(this.apiUrl, request).subscribe({
        next: (stakeholder) => {
          observer.next(this.mapToFrontend(stakeholder));
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Actualizar un stakeholder
   */
  updateStakeholder(id: string, stakeholder: Partial<Stakeholder>): Observable<Stakeholder> {
    const request: Partial<CreateStakeholderRequest> = {};

    if (stakeholder.nombre) request.nombre_completo = stakeholder.nombre;
    if (stakeholder.rol) request.rol = stakeholder.rol;
    if (stakeholder.area) request.area = stakeholder.area;
    if (stakeholder.contacto) request.contacto = stakeholder.contacto;
    if (stakeholder.notas !== undefined) request.notas = stakeholder.notas || undefined;
    if (stakeholder.color) request.color = stakeholder.color;

    return new Observable(observer => {
      this.http.patch<StakeholderBackend>(`${this.apiUrl}/${id}`, request).subscribe({
        next: (stakeholder) => {
          observer.next(this.mapToFrontend(stakeholder));
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Eliminar un stakeholder
   */
  deleteStakeholder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
