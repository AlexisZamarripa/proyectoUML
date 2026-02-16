import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentoItem {
  nombre: string;
  tipo: string;
  url: string;
  descripcion: string;
}

export interface AnalisisDocumento {
  id: string;
  titulo: string;
  tipoDocumento: string;
  fuente: string;
  proceso: number;
  subproceso: number;
  id_proyecto: number;
  id_proceso: number;
  id_subproceso: number;
  documentos: DocumentoItem[];
  hallazgos: string[];
  recomendaciones: string;
}

export interface CreateDocumentoDto {
  id_proyecto: number;
  id_proceso: number;
  id_subproceso: number;
  titulo_analisis: string;
  tipo_documento: string;
  fuente?: string;
  documentos?: DocumentoItem[];
  hallazgos?: string[];
  recomendaciones?: string;
}

export interface UpdateDocumentoDto {
  titulo_analisis?: string;
  tipo_documento?: string;
  fuente?: string;
  id_proceso?: number;
  id_subproceso?: number;
  documentos?: DocumentoItem[];
  hallazgos?: string[];
  recomendaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentoApiService {
  private apiUrl = 'http://localhost:3000/documentos';
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /**
   * Subir un archivo al servidor y obtener la URL
   */
  uploadFile(file: File): Observable<{ originalName: string; filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ originalName: string; filename: string; url: string }>(
      `${this.apiUrl}/upload`,
      formData
    );
  }

  /**
   * Obtener la URL completa de un archivo subido
   */
  getFileUrl(relativePath: string): string {
    if (!relativePath) return '';
    // URLs absolutas (http/https) y data URIs se devuelven tal cual
    if (relativePath.startsWith('http') || relativePath.startsWith('data:')) return relativePath;
    // Asegurar que la ruta relativa empiece con /
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Crear un nuevo análisis de documentos
   */
  create(dto: CreateDocumentoDto): Observable<AnalisisDocumento> {
    return this.http.post<AnalisisDocumento>(this.apiUrl, dto);
  }

  /**
   * Obtener todos los análisis de documentos de un proyecto
   */
  getByProyecto(idProyecto: number): Observable<AnalisisDocumento[]> {
    return this.http.get<AnalisisDocumento[]>(`${this.apiUrl}/proyecto/${idProyecto}`);
  }

  /**
   * Obtener un análisis por ID
   */
  getOne(id: number): Observable<AnalisisDocumento> {
    return this.http.get<AnalisisDocumento>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar un análisis de documentos
   */
  update(id: number, dto: UpdateDocumentoDto): Observable<AnalisisDocumento> {
    return this.http.patch<AnalisisDocumento>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Eliminar un análisis de documentos
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
