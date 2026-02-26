import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ← Agregar este tipo exportado
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

export interface RespuestaItem {
    id_pregunta: number;
    respuesta: string;
}

export interface RespuestaEncuesta {
    id_respuesta: number;
    id_pregunta: number;
    id_encuesta: number;
    id_subproceso: number;
    respuesta: string;
    fecha_respuesta: string;
}

export interface CreateRespuestasDto {
    id_encuesta: number;
    id_subproceso: number;
    respuestas: RespuestaItem[];
}

// ← Agregar este DTO
export interface CreateEncuestaDto {
    id_proyecto: number;
    id_proceso?: number;
    id_subproceso?: number;
    titulo_encuesta: string;
    descripcion: string;
    numero_participantes_esperados: number;
    preguntas: { pregunta: string; tipo_pregunta: TipoPregunta }[];
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

    /** POST /encuestas ← NUEVO */
    createEncuesta(dto: CreateEncuestaDto): Observable<Encuesta> {
        return this.http.post<Encuesta>(`${this.base}/encuestas`, dto);
    }

    /** DELETE /encuestas/:id ← NUEVO */
    deleteEncuesta(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/encuestas/${id}`);
    }

    /** GET /encuestas/:id/respuestas/:idSubproceso */
    getRespuestas(idEncuesta: number, idSubproceso: number): Observable<RespuestaEncuesta[]> {
        return this.http.get<RespuestaEncuesta[]>(
            `${this.base}/encuestas/${idEncuesta}/respuestas/${idSubproceso}`
        );
    }

    /** POST /encuestas/respuestas */
    saveRespuestas(dto: CreateRespuestasDto): Observable<RespuestaEncuesta[]> {
        return this.http.post<RespuestaEncuesta[]>(`${this.base}/encuestas/respuestas`, dto);
    }
}