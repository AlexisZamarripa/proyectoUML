import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistoriaUsuario {
    id_historia: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_historia?: string;
    rol?: string;
    quiero?: string;
    para_que?: string;
    prioridad?: 'baja' | 'media' | 'alta';
    estimacion?: string;
    criterios_aceptacion?: string;
}

export interface CreateHistoriaUsuarioDto {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_historia?: string;
    rol?: string;
    quiero?: string;
    para_que?: string;
    prioridad?: 'baja' | 'media' | 'alta';
    estimacion?: string;
    criterios_aceptacion?: string;
}

export interface UpdateHistoriaUsuarioDto {
    titulo_historia?: string;
    rol?: string;
    quiero?: string;
    para_que?: string;
    prioridad?: 'baja' | 'media' | 'alta';
    estimacion?: string;
    criterios_aceptacion?: string;
}

@Injectable({ providedIn: 'root' })
export class HistoriaUsuarioApiService {

    private base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    getHistorias(proyectoId: number): Observable<HistoriaUsuario[]> {
        return this.http.get<HistoriaUsuario[]>(`${this.base}/historias-usuario`, {
            params: { proyectoId: proyectoId.toString() }
        });
    }

    createHistoria(dto: CreateHistoriaUsuarioDto): Observable<HistoriaUsuario> {
        return this.http.post<HistoriaUsuario>(`${this.base}/historias-usuario`, dto);
    }

    updateHistoria(id: number, dto: UpdateHistoriaUsuarioDto): Observable<HistoriaUsuario> {
        return this.http.patch<HistoriaUsuario>(`${this.base}/historias-usuario/${id}`, dto);
    }

    deleteHistoria(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/historias-usuario/${id}`);
    }
}