import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ObservacionBackend {
    id_observacion: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nota_rapida: string;
    titulo: string;
    observaciones: string;
    hallazgos_puntos_clave: string;
}

export interface Observacion {
    id: string;
    idProyecto: string;
    idProceso: string;
    idSubproceso: string;
    notaRapida: string;
    titulo: string;
    observaciones: string;
    hallazgos: string[];
}

export interface CreateObservacionRequest {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    nota_rapida?: string;
    titulo?: string;
    observaciones?: string;
    hallazgos_puntos_clave?: string;
}

@Injectable({ providedIn: 'root' })
export class ObservacionApiService {
    private apiUrl = 'http://localhost:3000/observaciones';

    constructor(private http: HttpClient) { }

    // Convierte string del backend a array del frontend
    private parseHallazgos(hallazgos: string | null): string[] {
        if (!hallazgos) return [];
        try {
            const parsed = JSON.parse(hallazgos);
            return Array.isArray(parsed) ? parsed : [hallazgos];
        } catch {
            return hallazgos.split('\n').filter(h => h.trim());
        }
    }

    // Convierte array del frontend a string para el backend
    private stringifyHallazgos(hallazgos: string[]): string {
        return JSON.stringify(hallazgos.filter(h => h.trim()));
    }

    private mapToFrontend(observacion: ObservacionBackend): Observacion {
        return {
            id: observacion.id_observacion.toString(),
            idProyecto: observacion.id_proyecto.toString(),
            idProceso: observacion.id_proceso.toString(),
            idSubproceso: observacion.id_subproceso.toString(),
            notaRapida: observacion.nota_rapida || '',
            titulo: observacion.titulo || '',
            observaciones: observacion.observaciones || '',
            hallazgos: this.parseHallazgos(observacion.hallazgos_puntos_clave)
        };
    }

    getObservaciones(proyectoId?: string, procesoId?: string, subprocesoId?: string): Observable<Observacion[]> {
        let url = this.apiUrl;
        const params: string[] = [];
        if (subprocesoId) params.push(`subprocesoId=${subprocesoId}`);
        else if (procesoId) params.push(`procesoId=${procesoId}`);
        else if (proyectoId) params.push(`proyectoId=${proyectoId}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.http.get<ObservacionBackend[]>(url).pipe(
            map(observaciones => observaciones.map(o => this.mapToFrontend(o)))
        );
    }

    getObservacion(id: string): Observable<Observacion> {
        return this.http.get<ObservacionBackend>(`${this.apiUrl}/${id}`).pipe(
            map(observacion => this.mapToFrontend(observacion))
        );
    }

    createObservacion(
        proyectoId: string,
        procesoId: string,
        subprocesoId: string,
        observacion: Omit<Observacion, 'id' | 'idProyecto' | 'idProceso' | 'idSubproceso'>
    ): Observable<Observacion> {
        const request: CreateObservacionRequest = {
            id_proyecto: parseInt(proyectoId, 10),
            id_proceso: parseInt(procesoId, 10),
            id_subproceso: parseInt(subprocesoId, 10),
            nota_rapida: observacion.notaRapida || undefined,
            titulo: observacion.titulo || undefined,
            observaciones: observacion.observaciones || undefined,
            hallazgos_puntos_clave: observacion.hallazgos.length > 0
                ? this.stringifyHallazgos(observacion.hallazgos)
                : undefined
        };
        return this.http.post<ObservacionBackend>(this.apiUrl, request).pipe(
            map(o => this.mapToFrontend(o))
        );
    }

    updateObservacion(id: string, observacion: Partial<Observacion>): Observable<Observacion> {
        const request: Partial<CreateObservacionRequest> = {};
        if (observacion.notaRapida !== undefined) request.nota_rapida = observacion.notaRapida;
        if (observacion.titulo !== undefined) request.titulo = observacion.titulo;
        if (observacion.observaciones !== undefined) request.observaciones = observacion.observaciones;
        if (observacion.hallazgos !== undefined) {
            request.hallazgos_puntos_clave = this.stringifyHallazgos(observacion.hallazgos);
        }
        return this.http.patch<ObservacionBackend>(`${this.apiUrl}/${id}`, request).pipe(
            map(o => this.mapToFrontend(o))
        );
    }

    deleteObservacion(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}