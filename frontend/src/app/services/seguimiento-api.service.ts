import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Paso {
  nombre: string;
  duracion: string;
  responsable: string;
}

export interface Metrica {
  nombre: string;
  valor: string;
}

export interface SeguimientoResponse {
  id: string;
  titulo: string;
  fecha: string;
  idTransaccion: string;
  nombreProceso: string;
  procesoVinculado: string;
  subproceso: string;
  id_proyecto: number;
  id_proceso: number;
  id_subproceso: number;
  pasos: Paso[];
  problemas: string[];
  metricas: Metrica[];
}

export interface CreateSeguimientoDto {
  id_proyecto: number;
  id_proceso?: number;
  id_subproceso?: number;
  titulo: string;
  idTransaccion?: string; // Ahora es opcional, se genera automáticamente
  nombreProceso: string;
  procesoVinculado?: string;
  subproceso?: string;
  pasos?: Paso[];
  problemas?: string[];
  metricas?: Metrica[];
}

export interface UpdateSeguimientoDto {
  titulo?: string;
  idTransaccion?: string;
  nombreProceso?: string;
  procesoVinculado?: string;
  subproceso?: string;
  id_proceso?: number;
  id_subproceso?: number;
  pasos?: Paso[];
  problemas?: string[];
  metricas?: Metrica[];
}

@Injectable({
  providedIn: 'root'
})
export class SeguimientoApiService {
  private apiUrl = 'http://localhost:3000/seguimiento';

  constructor(private http: HttpClient) {}

  create(dto: CreateSeguimientoDto): Observable<SeguimientoResponse> {
    return this.http.post<SeguimientoResponse>(this.apiUrl, dto);
  }

  getByProyecto(idProyecto: number): Observable<SeguimientoResponse[]> {
    return this.http.get<SeguimientoResponse[]>(`${this.apiUrl}/proyecto/${idProyecto}`);
  }

  getOne(id: number): Observable<SeguimientoResponse> {
    return this.http.get<SeguimientoResponse>(`${this.apiUrl}/${id}`);
  }

  update(id: number, dto: UpdateSeguimientoDto): Observable<SeguimientoResponse> {
    return this.http.patch<SeguimientoResponse>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
