import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoService } from '../../services/proyecto.service';

interface Pregunta {
  id: string;
  texto: string;
  respuesta: string;
}

interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
}

interface Entrevista {
  id: string;
  titulo: string;
  entrevistador: string;
  entrevistado: string;
  fecha: string;
  notas: string;
  proceso: string;
  subproceso: string;
  preguntas: Pregunta[];
  archivos: ArchivoAdjunto[];
  estado: 'pendiente' | 'realizada';
  conRespuestas: boolean;
}

@Component({
  selector: 'app-entrevista',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './entrevista.component.html',
  styleUrls: ['./entrevista.component.css']
})
export class EntrevistaComponent implements OnInit {

  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  entrevistas: Entrevista[] = [];

  showForm = false;

  // Form fields
  titulo = '';
  entrevistador = '';
  entrevistado = '';
  notas = '';
  proceso = '';
  subproceso = '';
  preguntas: { texto: string }[] = [{ texto: '' }];

  // Anotar respuestas
  anotandoId: string | null = null;

  activeTab = 'entrevistas';

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoService: ProyectoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      const p = this.proyectoService.getProyectoById(id);
      if (p) {
        this.proyecto.nombre = p.nombre;
        this.proyecto.descripcion = p.descripcion;
        this.proyecto.color = p.color;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  // ===== STATS =====

  get totalEntrevistas(): number {
    return this.entrevistas.length;
  }

  get realizadas(): number {
    return this.entrevistas.filter(e => e.estado === 'realizada').length;
  }

  get pendientes(): number {
    return this.entrevistas.filter(e => e.estado === 'pendiente').length;
  }

  get entrevistasRealizadas(): Entrevista[] {
    return this.entrevistas.filter(e => e.estado === 'realizada');
  }

  get entrevistasPendientes(): Entrevista[] {
    return this.entrevistas.filter(e => e.estado === 'pendiente');
  }

  // ===== FORM =====

  handleSubmit(): void {
    if (!this.titulo || !this.entrevistador || !this.entrevistado) return;

    const nueva: Entrevista = {
      id: this.generateUUID(),
      titulo: this.titulo,
      entrevistador: this.entrevistador,
      entrevistado: this.entrevistado,
      fecha: new Date().toISOString().split('T')[0],
      notas: this.notas,
      proceso: this.proceso,
      subproceso: this.subproceso,
      preguntas: this.preguntas
        .filter(p => p.texto.trim())
        .map(p => ({ id: this.generateUUID(), texto: p.texto, respuesta: '' })),
      archivos: [],
      estado: 'pendiente',
      conRespuestas: false,
    };

    this.entrevistas.push(nueva);
    this.resetForm();
  }

  resetForm(): void {
    this.titulo = '';
    this.entrevistador = '';
    this.entrevistado = '';
    this.notas = '';
    this.proceso = '';
    this.subproceso = '';
    this.preguntas = [{ texto: '' }];
    this.showForm = false;
  }

  addPregunta(): void {
    this.preguntas.push({ texto: '' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) {
      this.preguntas.splice(index, 1);
    }
  }

  // ===== ANOTAR RESPUESTAS =====

  startAnotar(entrevistaId: string): void {
    this.anotandoId = entrevistaId;
  }

  cancelAnotar(): void {
    this.anotandoId = null;
  }

  guardarRespuestas(entrevista: Entrevista): void {
    const tieneRespuestas = entrevista.preguntas.some(p => p.respuesta.trim());
    entrevista.conRespuestas = tieneRespuestas;
    if (tieneRespuestas) {
      entrevista.estado = 'realizada';
    }
    this.anotandoId = null;
  }

  // ===== FILES =====

  onFileSelect(event: Event, entrevistaId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const entrevista = this.entrevistas.find(e => e.id === entrevistaId);
      if (entrevista) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          entrevista.archivos.push({
            id: this.generateUUID(),
            nombre: file.name,
            tipo: file.type,
          });
        }
      }
    }
  }

  removeArchivo(entrevistaId: string, archivoId: string): void {
    const entrevista = this.entrevistas.find(e => e.id === entrevistaId);
    if (entrevista) {
      entrevista.archivos = entrevista.archivos.filter(a => a.id !== archivoId);
    }
  }

  deleteEntrevista(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Eliminar esta entrevista?')) {
      this.entrevistas = this.entrevistas.filter(e => e.id !== id);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
