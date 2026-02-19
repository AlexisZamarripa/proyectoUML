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
    fecha: string;
}

export interface CreateObservacionDto {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo?: string;
    observaciones?: string;
    hallazgos_puntos_clave?: string;
}

@Injectable({ providedIn: 'root' })
export class ObservacionApiService {

    private base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    getObservaciones(proyectoId: number): Observable<Observacion[]> {
        return this.http.get<Observacion[]>(`${this.base}/observaciones`, {
            params: { proyectoId: proyectoId.toString() }
        });
    }

    createObservacion(dto: CreateObservacionDto): Observable<Observacion> {
        return this.http.post<Observacion>(`${this.base}/observaciones`, dto);
    }

    deleteObservacion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/observaciones/${id}`);
    }
}