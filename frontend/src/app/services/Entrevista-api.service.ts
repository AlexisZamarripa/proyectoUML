import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PreguntaBackend {
    id_pregunta: number;
    id_entrevista: number;
    pregunta: string;
}

export interface EntrevistaBackend {
    id_entrevista: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_entrevista: string;
    entrevistador: string;
    entrevistado: string;
    notas_contexto: string;
    preguntas: PreguntaBackend[];
}

export interface Pregunta {
    id: string;
    texto: string;
    respuesta: string;
}

export interface Entrevista {
    id: string;
    idProyecto: string;
    idProceso: string;
    idSubproceso: string;
    titulo: string;
    entrevistador: string;
    entrevistado: string;
    notas: string;
    preguntas: Pregunta[];
}

export interface CreatePreguntaRequest {
    pregunta: string;
}

export interface CreateEntrevistaRequest {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_entrevista: string;
    entrevistador: string;
    entrevistado: string;
    notas_contexto?: string;
    preguntas?: CreatePreguntaRequest[];
}

@Injectable({ providedIn: 'root' })
export class EntrevistaApiService {
    private apiUrl = 'http://localhost:3000/entrevistas';

    constructor(private http: HttpClient) { }

    private mapToFrontend(entrevista: EntrevistaBackend): Entrevista {
        return {
            id: entrevista.id_entrevista.toString(),
            idProyecto: entrevista.id_proyecto.toString(),
            idProceso: entrevista.id_proceso.toString(),
            idSubproceso: entrevista.id_subproceso.toString(),
            titulo: entrevista.titulo_entrevista,
            entrevistador: entrevista.entrevistador,
            entrevistado: entrevista.entrevistado,
            notas: entrevista.notas_contexto || '',
            preguntas: (entrevista.preguntas || []).map(p => ({
                id: p.id_pregunta.toString(),
                texto: p.pregunta,
                respuesta: ''
            }))
        };
    }

    getEntrevistas(proyectoId?: string, procesoId?: string, subprocesoId?: string): Observable<Entrevista[]> {
        let url = this.apiUrl;
        const params: string[] = [];
        if (subprocesoId) params.push(`subprocesoId=${subprocesoId}`);
        else if (procesoId) params.push(`procesoId=${procesoId}`);
        else if (proyectoId) params.push(`proyectoId=${proyectoId}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.http.get<EntrevistaBackend[]>(url).pipe(
            map(entrevistas => entrevistas.map(e => this.mapToFrontend(e)))
        );
    }

    getEntrevista(id: string): Observable<Entrevista> {
        return this.http.get<EntrevistaBackend>(`${this.apiUrl}/${id}`).pipe(
            map(entrevista => this.mapToFrontend(entrevista))
        );
    }

    createEntrevista(
        proyectoId: string,
        procesoId: string,
        subprocesoId: string,
        entrevista: Omit<Entrevista, 'id' | 'idProyecto' | 'idProceso' | 'idSubproceso'>
    ): Observable<Entrevista> {
        const request: CreateEntrevistaRequest = {
            id_proyecto: parseInt(proyectoId, 10),
            id_proceso: parseInt(procesoId, 10),
            id_subproceso: parseInt(subprocesoId, 10),
            titulo_entrevista: entrevista.titulo,
            entrevistador: entrevista.entrevistador,
            entrevistado: entrevista.entrevistado,
            notas_contexto: entrevista.notas || undefined,
            preguntas: entrevista.preguntas
                .filter(p => p.texto.trim())
                .map(p => ({ pregunta: p.texto }))
        };
        return this.http.post<EntrevistaBackend>(this.apiUrl, request).pipe(
            map(e => this.mapToFrontend(e))
        );
    }

    updateEntrevista(id: string, entrevista: Partial<Entrevista>): Observable<Entrevista> {
        const request: Partial<CreateEntrevistaRequest> = {};
        if (entrevista.titulo) request.titulo_entrevista = entrevista.titulo;
        if (entrevista.entrevistador) request.entrevistador = entrevista.entrevistador;
        if (entrevista.entrevistado) request.entrevistado = entrevista.entrevistado;
        if (entrevista.notas !== undefined) request.notas_contexto = entrevista.notas || undefined;
        if (entrevista.preguntas) {
            request.preguntas = entrevista.preguntas
                .filter(p => p.texto.trim())
                .map(p => ({ pregunta: p.texto }));
        }
        return this.http.patch<EntrevistaBackend>(`${this.apiUrl}/${id}`, request).pipe(
            map(e => this.mapToFrontend(e))
        );
    }

    deleteEntrevista(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}