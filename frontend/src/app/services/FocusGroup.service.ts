import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FocusGroup {
    id_focus: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nombre_focus?: string;
    descripcion?: string;
    fecha_inicio?: string;
    estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';
    color?: string;
}

export interface CreateFocusGroupDto {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nombre_focus?: string;
    descripcion?: string;
    fecha_inicio?: string;
    estado?: 'planificacion' | 'en_progreso' | 'pausado' | 'completado';
    color?: string;
}

@Injectable({ providedIn: 'root' })
export class FocusGroupApiService {

    private base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    getFocusGroups(proyectoId: number): Observable<FocusGroup[]> {
        return this.http.get<FocusGroup[]>(`${this.base}/focus-group`, {
            params: { proyectoId: proyectoId.toString() }
        });
    }

    createFocusGroup(dto: CreateFocusGroupDto): Observable<FocusGroup> {
        return this.http.post<FocusGroup>(`${this.base}/focus-group`, dto);
    }

    deleteFocusGroup(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/focus-group/${id}`);
    }
}