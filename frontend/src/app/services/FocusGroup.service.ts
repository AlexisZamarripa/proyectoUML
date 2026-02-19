import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type EstadoFocusBackend = 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

export interface FocusGroupBackend {
    id_focus: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nombre_focus: string;
    descripcion: string;
    fecha_inicio: string;
    estado: EstadoFocusBackend;
    color: string;
}

export type EstadoFocus = 'planificacion' | 'en-progreso' | 'pausado' | 'completado';

export interface FocusGroup {
    id: string;
    idProyecto: string;
    idProceso: string;
    idSubproceso: string;
    titulo: string;
    descripcion: string;
    fechaInicio: string;
    estado: EstadoFocus;
    color: string;
}

export interface CreateFocusGroupRequest {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nombre_focus?: string;
    descripcion?: string;
    fecha_inicio?: string;
    estado?: EstadoFocusBackend;
    color?: string;
}

@Injectable({ providedIn: 'root' })
export class FocusGroupApiService {
    private apiUrl = 'http://localhost:3000/focus-group';

    constructor(private http: HttpClient) { }

    // Convierte estado frontend (en-progreso) → backend (en_progreso)
    private estadoToBackend(estado: EstadoFocus): EstadoFocusBackend {
        return estado.replace('-', '_') as EstadoFocusBackend;
    }

    // Convierte estado backend (en_progreso) → frontend (en-progreso)
    private estadoFromBackend(estado: EstadoFocusBackend): EstadoFocus {
        return estado.replace('_', '-') as EstadoFocus;
    }

    private mapToFrontend(focus: FocusGroupBackend): FocusGroup {
        return {
            id: focus.id_focus.toString(),
            idProyecto: focus.id_proyecto.toString(),
            idProceso: focus.id_proceso.toString(),
            idSubproceso: focus.id_subproceso.toString(),
            titulo: focus.nombre_focus || '',
            descripcion: focus.descripcion || '',
            fechaInicio: focus.fecha_inicio || '',
            estado: focus.estado ? this.estadoFromBackend(focus.estado) : 'planificacion',
            color: focus.color || ''
        };
    }

    getFocusGroups(proyectoId?: string, procesoId?: string, subprocesoId?: string, estado?: EstadoFocus): Observable<FocusGroup[]> {
        let url = this.apiUrl;
        const params: string[] = [];
        if (estado) params.push(`estado=${this.estadoToBackend(estado)}`);
        else if (subprocesoId) params.push(`subprocesoId=${subprocesoId}`);
        else if (procesoId) params.push(`procesoId=${procesoId}`);
        else if (proyectoId) params.push(`proyectoId=${proyectoId}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.http.get<FocusGroupBackend[]>(url).pipe(
            map(grupos => grupos.map(fg => this.mapToFrontend(fg)))
        );
    }

    getFocusGroup(id: string): Observable<FocusGroup> {
        return this.http.get<FocusGroupBackend>(`${this.apiUrl}/${id}`).pipe(
            map(focus => this.mapToFrontend(focus))
        );
    }

    createFocusGroup(
        proyectoId: string,
        procesoId: string,
        subprocesoId: string,
        focus: Omit<FocusGroup, 'id' | 'idProyecto' | 'idProceso' | 'idSubproceso'>
    ): Observable<FocusGroup> {
        const request: CreateFocusGroupRequest = {
            id_proyecto: parseInt(proyectoId, 10),
            id_proceso: parseInt(procesoId, 10),
            id_subproceso: parseInt(subprocesoId, 10),
            nombre_focus: focus.titulo || undefined,
            descripcion: focus.descripcion || undefined,
            fecha_inicio: focus.fechaInicio || undefined,
            estado: focus.estado ? this.estadoToBackend(focus.estado) : undefined,
            color: focus.color || undefined
        };
        return this.http.post<FocusGroupBackend>(this.apiUrl, request).pipe(
            map(fg => this.mapToFrontend(fg))
        );
    }

    updateFocusGroup(id: string, focus: Partial<FocusGroup>): Observable<FocusGroup> {
        const request: Partial<CreateFocusGroupRequest> = {};
        if (focus.titulo !== undefined) request.nombre_focus = focus.titulo;
        if (focus.descripcion !== undefined) request.descripcion = focus.descripcion;
        if (focus.fechaInicio !== undefined) request.fecha_inicio = focus.fechaInicio;
        if (focus.estado !== undefined) request.estado = this.estadoToBackend(focus.estado);
        if (focus.color !== undefined) request.color = focus.color;
        return this.http.patch<FocusGroupBackend>(`${this.apiUrl}/${id}`, request).pipe(
            map(fg => this.mapToFrontend(fg))
        );
    }

    deleteFocusGroup(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}