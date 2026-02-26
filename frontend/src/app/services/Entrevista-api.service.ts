// entrevista-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PreguntaEntrevista {
    id_pregunta: number;
    id_entrevista: number;
    pregunta: string;
    respuesta: string;
}

export interface Entrevista {
    id_entrevista: number;
    titulo_entrevista: string;
    entrevistador: string;
    entrevistado: string;
    notas_contexto: string;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    preguntas: PreguntaEntrevista[];
}

export interface CreatePreguntaDto {
    pregunta: string;
    respuesta?: string;
}

export interface CreateEntrevistaDto {
    id_proyecto: number;
    id_proceso?: number;       // opcional — la vinculación se hace desde procesos
    id_subproceso?: number;    // opcional — la vinculación se hace desde procesos
    titulo_entrevista?: string;
    entrevistador?: string;
    entrevistado?: string;
    notas_contexto?: string;
    preguntas?: CreatePreguntaDto[];
}

@Injectable({ providedIn: 'root' })
export class EntrevistaApiService {

    private base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    /** GET /entrevistas?proyectoId=X */
    getEntrevistas(proyectoId: number): Observable<Entrevista[]> {
        return this.http.get<Entrevista[]>(`${this.base}/entrevistas`, {
            params: { proyectoId: proyectoId.toString() }
        });
    }

    /** GET /entrevistas/:id */
    getEntrevista(id: number): Observable<Entrevista> {
        return this.http.get<Entrevista>(`${this.base}/entrevistas/${id}`);
    }

    /** POST /entrevistas */
    createEntrevista(dto: CreateEntrevistaDto): Observable<Entrevista> {
        return this.http.post<Entrevista>(`${this.base}/entrevistas`, dto);
    }

    /** PATCH /entrevistas/:id */
    updateEntrevista(id: number, dto: Partial<CreateEntrevistaDto>): Observable<Entrevista> {
        return this.http.patch<Entrevista>(`${this.base}/entrevistas/${id}`, dto);
    }

    /** DELETE /entrevistas/:id */
    deleteEntrevista(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/entrevistas/${id}`);
    }
}