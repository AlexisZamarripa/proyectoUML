import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Observacion {
    id_observacion: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo: string;
    observaciones: string;
    hallazgos_puntos_clave?: string;
    fecha?: string;
}

export interface CreateObservacionDto {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo: string;
    observaciones: string;
    hallazgos_puntos_clave?: string;
}

// El DTO de actualización acepta los mismos campos, todos opcionales
export type UpdateObservacionDto = Partial<CreateObservacionDto>;

@Injectable({ providedIn: 'root' })
export class ObservacionApiService {

    private base = 'http://localhost:3000/observaciones';

    constructor(private http: HttpClient) { }

    getObservaciones(idProyecto: number): Observable<Observacion[]> {
        return this.http.get<Observacion[]>(`${this.base}?proyectoId=${idProyecto}`);
    }

    createObservacion(dto: CreateObservacionDto): Observable<Observacion> {
        return this.http.post<Observacion>(this.base, dto);
    }

    /** Llama al endpoint PATCH /observaciones/:id */
    updateObservacion(id: number, dto: UpdateObservacionDto): Observable<Observacion> {
        return this.http.patch<Observacion>(`${this.base}/${id}`, dto);
    }

    deleteObservacion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}