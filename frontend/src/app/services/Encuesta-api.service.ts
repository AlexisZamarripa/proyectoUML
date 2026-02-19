import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export type TipoPregunta = 'texto_abierto' | 'opcion_multiple' | 'escala' | 'si_no';

export interface PreguntaEncuesta {
    id_pregunta: number;
    id_encuesta: number;
    pregunta: string;
    tipo_pregunta: TipoPregunta;
}

export interface Encuesta {
    id_encuesta: number;
    titulo_encuesta: string;
    descripcion: string;
    numero_participantes_esperados: number;
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    preguntas: PreguntaEncuesta[];
}

export interface CreatePreguntaDto {
    pregunta: string;
    tipo_pregunta?: TipoPregunta;
}

export interface CreateEncuestaDto {
    id_proyecto: number;
    id_proceso: number;
    id_subproceso: number;
    titulo_encuesta?: string;
    descripcion?: string;
    numero_participantes_esperados?: number;
    preguntas?: CreatePreguntaDto[];
}

@Injectable({ providedIn: 'root' })
export class EncuestaApiService {

    private base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    /** GET /encuestas?proyectoId=X */
    getEncuestas(proyectoId: number): Observable<Encuesta[]> {
        return this.http.get<Encuesta[]>(`${this.base}/encuestas`, {
            params: { proyectoId: proyectoId.toString() }
        });
    }

    /** GET /encuestas/:id */
    getEncuesta(id: number): Observable<Encuesta> {
        return this.http.get<Encuesta>(`${this.base}/encuestas/${id}`);
    }

    /** POST /encuestas */
    createEncuesta(dto: CreateEncuestaDto): Observable<Encuesta> {
        return this.http.post<Encuesta>(`${this.base}/encuestas`, dto);
    }

    /** PATCH /encuestas/:id */
    updateEncuesta(id: number, dto: Partial<CreateEncuestaDto>): Observable<Encuesta> {
        return this.http.patch<Encuesta>(`${this.base}/encuestas/${id}`, dto);
    }

    /** DELETE /encuestas/:id */
    deleteEncuesta(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/encuestas/${id}`);
    }
}