import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { HerramientaOpcion, TipoHerramienta } from '../Admin/procesos/procesos.component';

@Injectable({
  providedIn: 'root'
})
export class HerramientaApiService {

  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las herramientas disponibles de un tipo dado para un proyecto.
   * Normaliza cada respuesta a { id, nombre, detalle } para el selector.
   */
  getHerramientasByTipo(tipo: TipoHerramienta, proyectoId: number): Observable<HerramientaOpcion[]> {
    const params = { proyectoId: proyectoId.toString() };

    switch (tipo) {

      case 'encuesta':
        // GET /encuestas?proyectoId=X
        return this.http
          .get<any[]>(`${this.base}/encuestas`, { params })
          .pipe(map(items => items.map(i => ({
            id: String(i.id_encuesta),
            nombre: i.titulo_encuesta,
            detalle: i.descripcion
          }))));

      case 'entrevista':
        // GET /entrevistas?proyectoId=X
        return this.http
          .get<any[]>(`${this.base}/entrevistas`, { params })
          .pipe(map(items => items.map(i => ({
            id: String(i.id_entrevista),
            nombre: i.titulo_entrevista,
            detalle: i.entrevistador ? `Entrevistador: ${i.entrevistador}` : undefined
          }))));

      case 'documento':
        // GET /documentos/proyecto/:id
        return this.http
          .get<any[]>(`${this.base}/documentos/proyecto/${proyectoId}`)
          .pipe(map(items => items.map(i => ({
            id: String(i.id),
            nombre: i.titulo,
            detalle: i.tipoDocumento
          }))));

      case 'focus_group':
        // GET /focus-group?proyectoId=X
        return this.http
          .get<any[]>(`${this.base}/focus-group`, { params })
          .pipe(map(items => items.map(i => ({
            id: String(i.id_focus),
            nombre: i.nombre_focus,
            detalle: i.estado ? `Estado: ${i.estado}` : undefined
          }))));

      case 'historia_usuario':
        // GET /historias-usuario?proyectoId=X
        return this.http
          .get<any[]>(`${this.base}/historias-usuario`, { params })
          .pipe(map(items => items.map(i => ({
            id: String(i.id_historia),
            nombre: i.titulo_historia,
            detalle: i.prioridad ? `Prioridad: ${i.prioridad}` : undefined
          }))));

      case 'observacion':
        // GET /observaciones?proyectoId=X
        return this.http
          .get<any[]>(`${this.base}/observaciones`, { params })
          .pipe(map(items => items.map(i => ({
            id: String(i.id_observacion),
            nombre: i.titulo,
            detalle: i.hallazgos_puntos_clave
          }))));

      case 'seguimiento':
        // GET /seguimiento/proyecto/:id
        return this.http
          .get<any[]>(`${this.base}/seguimiento/proyecto/${proyectoId}`)
          .pipe(map(items => items.map(i => ({
            id: String(i.id),
            nombre: i.titulo,
            detalle: i.nombreProceso ? `Proceso: ${i.nombreProceso}` : undefined
          }))));
    }
  }
}