import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type PrioridadBackend = 'baja' | 'media' | 'alta';

export interface HistoriaUsuarioBackend {
    id_historia: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_historia: string;
    rol: string;
    quiero: string;
    para_que: string;
    prioridad: PrioridadBackend;
    estimacion: string;
    criterios_aceptacion: string;
}

export type Prioridad = 'Alta' | 'Media' | 'Baja';

export interface HistoriaUsuario {
    id: string;
    idProyecto: string;
    idProceso: string;
    idSubproceso: string;
    titulo: string;
    rol: string;
    quiero: string;
    paraque: string;
    prioridad: Prioridad;
    estimacion: string;
    criteriosAceptacion: string[];
}

export interface CreateHistoriaUsuarioRequest {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_historia?: string;
    rol?: string;
    quiero?: string;
    para_que?: string;
    prioridad?: PrioridadBackend;
    estimacion?: string;
    criterios_aceptacion?: string;
}

@Injectable({ providedIn: 'root' })
export class HistoriaUsuarioApiService {
    private apiUrl = 'http://localhost:3000/historias-usuario';

    constructor(private http: HttpClient) { }

    // Convierte prioridad frontend (Alta) → backend (alta)
    private prioridadToBackend(prioridad: Prioridad): PrioridadBackend {
        return prioridad.toLowerCase() as PrioridadBackend;
    }

    // Convierte prioridad backend (alta) → frontend (Alta)
    private prioridadFromBackend(prioridad: PrioridadBackend): Prioridad {
        return (prioridad.charAt(0).toUpperCase() + prioridad.slice(1)) as Prioridad;
    }

    // Convierte string del backend a array del frontend
    private parseCriterios(criterios: string | null): string[] {
        if (!criterios) return [];
        try {
            const parsed = JSON.parse(criterios);
            return Array.isArray(parsed) ? parsed : [criterios];
        } catch {
            return criterios.split('\n').filter(c => c.trim());
        }
    }

    // Convierte array del frontend a string para el backend
    private stringifyCriterios(criterios: string[]): string {
        return JSON.stringify(criterios.filter(c => c.trim()));
    }

    private mapToFrontend(historia: HistoriaUsuarioBackend): HistoriaUsuario {
        return {
            id: historia.id_historia.toString(),
            idProyecto: historia.id_proyecto.toString(),
            idProceso: historia.id_proceso.toString(),
            idSubproceso: historia.id_subproceso.toString(),
            titulo: historia.titulo_historia || '',
            rol: historia.rol || '',
            quiero: historia.quiero || '',
            paraque: historia.para_que || '',
            prioridad: historia.prioridad ? this.prioridadFromBackend(historia.prioridad) : 'Media',
            estimacion: historia.estimacion || '',
            criteriosAceptacion: this.parseCriterios(historia.criterios_aceptacion)
        };
    }

    getHistorias(proyectoId?: string, procesoId?: string, subprocesoId?: string, prioridad?: Prioridad): Observable<HistoriaUsuario[]> {
        let url = this.apiUrl;
        const params: string[] = [];
        if (prioridad) params.push(`prioridad=${this.prioridadToBackend(prioridad)}`);
        else if (subprocesoId) params.push(`subprocesoId=${subprocesoId}`);
        else if (procesoId) params.push(`procesoId=${procesoId}`);
        else if (proyectoId) params.push(`proyectoId=${proyectoId}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.http.get<HistoriaUsuarioBackend[]>(url).pipe(
            map(historias => historias.map(h => this.mapToFrontend(h)))
        );
    }

    getHistoria(id: string): Observable<HistoriaUsuario> {
        return this.http.get<HistoriaUsuarioBackend>(`${this.apiUrl}/${id}`).pipe(
            map(historia => this.mapToFrontend(historia))
        );
    }

    createHistoria(
        proyectoId: string,
        procesoId: string,
        subprocesoId: string,
        historia: Omit<HistoriaUsuario, 'id' | 'idProyecto' | 'idProceso' | 'idSubproceso'>
    ): Observable<HistoriaUsuario> {
        const request: CreateHistoriaUsuarioRequest = {
            id_proyecto: parseInt(proyectoId, 10),
            id_proceso: parseInt(procesoId, 10),
            id_subproceso: parseInt(subprocesoId, 10),
            titulo_historia: historia.titulo || undefined,
            rol: historia.rol || undefined,
            quiero: historia.quiero || undefined,
            para_que: historia.paraque || undefined,
            prioridad: historia.prioridad ? this.prioridadToBackend(historia.prioridad) : undefined,
            estimacion: historia.estimacion || undefined,
            criterios_aceptacion: historia.criteriosAceptacion.length > 0
                ? this.stringifyCriterios(historia.criteriosAceptacion)
                : undefined
        };
        return this.http.post<HistoriaUsuarioBackend>(this.apiUrl, request).pipe(
            map(h => this.mapToFrontend(h))
        );
    }

    updateHistoria(id: string, historia: Partial<HistoriaUsuario>): Observable<HistoriaUsuario> {
        const request: Partial<CreateHistoriaUsuarioRequest> = {};
        if (historia.titulo !== undefined) request.titulo_historia = historia.titulo;
        if (historia.rol !== undefined) request.rol = historia.rol;
        if (historia.quiero !== undefined) request.quiero = historia.quiero;
        if (historia.paraque !== undefined) request.para_que = historia.paraque;
        if (historia.prioridad !== undefined) request.prioridad = this.prioridadToBackend(historia.prioridad);
        if (historia.estimacion !== undefined) request.estimacion = historia.estimacion;
        if (historia.criteriosAceptacion !== undefined) {
            request.criterios_aceptacion = this.stringifyCriterios(historia.criteriosAceptacion);
        }
        return this.http.patch<HistoriaUsuarioBackend>(`${this.apiUrl}/${id}`, request).pipe(
            map(h => this.mapToFrontend(h))
        );
    }

    deleteHistoria(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}