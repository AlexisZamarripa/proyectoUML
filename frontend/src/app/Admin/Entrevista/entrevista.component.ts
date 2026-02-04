import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PreguntaRespuesta {
  pregunta: string;
  respuesta: string;
}

interface Entrevista {
  id: string;
  date: string;
  titulo: string;
  entrevistador: string;
  entrevistado: string;
  preguntas: PreguntaRespuesta[];
  notas?: string;
  realizada: boolean;
  fechaRealizacion?: string;
  archivoUrl?: string;
  archivoTipo?: 'link' | 'pdf' | 'audio' | 'video';
  archivoNombre?: string;
}

@Component({
  selector: 'app-entrevista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrevista.component.html',
  styleUrls: ['./entrevista.component.css']
})
export class EntrevistaComponent {
  entrevistas: Entrevista[] = [];
  showForm = false;
  selectedEntrevista: Entrevista | null = null;
  showUploadModal = false;
  uploadModalEntrevistaId: string | null = null;

  // Form state
  titulo = '';
  entrevistador = '';
  entrevistado = '';
  notas = '';
  preguntas: PreguntaRespuesta[] = [{ pregunta: '', respuesta: '' }];

  // Upload modal state
  uploadTipo: 'link' | 'pdf' | 'audio' | 'video' = 'link';
  uploadUrl = '';
  uploadNombre = '';
  selectedFile: File | null = null;

  addPregunta() {
    this.preguntas.push({ pregunta: '', respuesta: '' });
  }

  removePregunta(index: number) {
    this.preguntas = this.preguntas.filter((_, i) => i !== index);
  }

  handleSubmit() {
    const entrevista: Entrevista = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      titulo: this.titulo,
      entrevistador: this.entrevistador,
      entrevistado: this.entrevistado,
      preguntas: this.preguntas.filter(p => p.pregunta.trim() !== ''),
      notas: this.notas || undefined,
      realizada: false,
    };

    this.entrevistas.push(entrevista);

    // Reset
    this.titulo = '';
    this.entrevistador = '';
    this.entrevistado = '';
    this.notas = '';
    this.preguntas = [{ pregunta: '', respuesta: '' }];
    this.showForm = false;
  }

  toggleRealizada(id: string) {
    const entrevista = this.entrevistas.find(e => e.id === id);
    if (entrevista) {
      entrevista.realizada = !entrevista.realizada;
      entrevista.fechaRealizacion = entrevista.realizada ? new Date().toISOString() : undefined;
    }
  }

  deleteEntrevista(id: string) {
    this.entrevistas = this.entrevistas.filter(e => e.id !== id);
  }

  openUploadModal(id: string) {
    this.uploadModalEntrevistaId = id;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.uploadModalEntrevistaId = null;
    this.uploadUrl = '';
    this.uploadNombre = '';
    this.selectedFile = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        this.handleFileUpload(base64String, this.selectedFile!);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  handleFileUpload(base64String: string, file: File) {
    if (!this.uploadModalEntrevistaId) return;

    const entrevista = this.entrevistas.find(e => e.id === this.uploadModalEntrevistaId);
    if (entrevista) {
      let tipo: 'pdf' | 'audio' | 'video' = 'pdf';
      
      if (file.type.startsWith('audio/')) tipo = 'audio';
      else if (file.type.startsWith('video/')) tipo = 'video';
      
      entrevista.archivoUrl = base64String;
      entrevista.archivoTipo = tipo;
      entrevista.archivoNombre = file.name;
      
      this.closeUploadModal();
    }
  }

  handleLinkUpload() {
    if (!this.uploadModalEntrevistaId || !this.uploadUrl) return;

    const entrevista = this.entrevistas.find(e => e.id === this.uploadModalEntrevistaId);
    if (entrevista) {
      entrevista.archivoUrl = this.uploadUrl;
      entrevista.archivoTipo = this.uploadTipo;
      entrevista.archivoNombre = this.uploadNombre || this.uploadUrl;
      
      this.closeUploadModal();
    }
  }

  removeArchivo(id: string) {
    const entrevista = this.entrevistas.find(e => e.id === id);
    if (entrevista) {
      entrevista.archivoUrl = undefined;
      entrevista.archivoTipo = undefined;
      entrevista.archivoNombre = undefined;
    }
  }

  get entrevistasPendientes() {
    return this.entrevistas.filter(e => !e.realizada);
  }

  get entrevistasRealizadas() {
    return this.entrevistas.filter(e => e.realizada);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatShortDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }
}
