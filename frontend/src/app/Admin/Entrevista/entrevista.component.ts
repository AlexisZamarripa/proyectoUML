import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { EntrevistaApiService, Entrevista } from '../../services/Entrevista-api.service';

interface PreguntaForm {
  texto: string;
}

interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
}

interface EntrevistaUI extends Entrevista {
  estado: 'pendiente' | 'realizada';
  conRespuestas: boolean;
  archivos: ArchivoAdjunto[];
  fecha: string;
}

@Component({
  selector: 'app-entrevista',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './entrevista.component.html',
  styleUrls: ['./entrevista.component.css']
})
export class EntrevistaComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };

  entrevistas: EntrevistaUI[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';
  anotandoId: string | null = null;
  activeTab = 'entrevistas';

  // Form fields
  titulo = '';
  entrevistador = '';
  entrevistado = '';
  notas = '';
  proceso = '';
  subproceso = '';
  preguntas: PreguntaForm[] = [{ texto: '' }];

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
    private proyectoApiService: ProyectoApiService,
    private entrevistaApiService: EntrevistaApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto.nombre = p.nombre;
          this.proyecto.descripcion = p.descripcion;
          this.proyecto.color = p.color;
          this.cargarEntrevistas();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  cargarEntrevistas(): void {
    this.isLoading = true;
    this.entrevistaApiService.getEntrevistas(this.proyecto.id).subscribe({
      next: (data) => {
        this.entrevistas = data.map(e => ({
          ...e,
          estado: 'pendiente' as const,
          conRespuestas: false,
          archivos: [],
          fecha: new Date().toISOString().split('T')[0]
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar entrevistas:', err);
        this.isLoading = false;
      }
    });
  }

  // Stats
  get totalEntrevistas(): number { return this.entrevistas.length; }
  get realizadas(): number { return this.entrevistas.filter(e => e.estado === 'realizada').length; }
  get pendientes(): number { return this.entrevistas.filter(e => e.estado === 'pendiente').length; }
  get entrevistasRealizadas(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'realizada'); }
  get entrevistasPendientes(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'pendiente'); }

  handleSubmit(): void {
    if (!this.titulo || !this.entrevistador || !this.entrevistado) return;

    const procesoId = (parseInt(this.proceso, 10) || 1).toString();
    const subprocesoId = (parseInt(this.subproceso, 10) || 1).toString();

    this.entrevistaApiService.createEntrevista(
      this.proyecto.id,
      procesoId,
      subprocesoId,
      {
        titulo: this.titulo,
        entrevistador: this.entrevistador,
        entrevistado: this.entrevistado,
        notas: this.notas,
        preguntas: this.preguntas
          .filter(p => p.texto.trim())
          .map(p => ({ id: '', texto: p.texto, respuesta: '' }))
      }
    ).subscribe({
      next: (nueva) => {
        const nuevaUI: EntrevistaUI = {
          ...nueva,
          estado: 'pendiente',
          conRespuestas: false,
          archivos: [],
          fecha: new Date().toISOString().split('T')[0]
        };
        this.entrevistas.push(nuevaUI);
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al crear entrevista:', err);
        this.errorMsg = 'Error al crear la entrevista. Intenta de nuevo.';
      }
    });
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
    this.errorMsg = '';
  }

  addPregunta(): void { this.preguntas.push({ texto: '' }); }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) this.preguntas.splice(index, 1);
  }

  startAnotar(entrevistaId: string): void { this.anotandoId = entrevistaId; }
  cancelAnotar(): void { this.anotandoId = null; }

  guardarRespuestas(entrevista: EntrevistaUI): void {
    const tieneRespuestas = entrevista.preguntas.some(p => p.respuesta.trim());
    entrevista.conRespuestas = tieneRespuestas;
    if (tieneRespuestas) entrevista.estado = 'realizada';
    this.anotandoId = null;
  }

  onFileSelect(event: Event, entrevistaId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const entrevista = this.entrevistas.find(e => e.id === entrevistaId);
      if (entrevista) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          entrevista.archivos.push({ id: this.generateUUID(), nombre: file.name, tipo: file.type });
        }
      }
    }
  }

  removeArchivo(entrevistaId: string, archivoId: string): void {
    const entrevista = this.entrevistas.find(e => e.id === entrevistaId);
    if (entrevista) entrevista.archivos = entrevista.archivos.filter(a => a.id !== archivoId);
  }

  deleteEntrevista(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar esta entrevista?')) return;
    this.entrevistaApiService.deleteEntrevista(id).subscribe({
      next: () => { this.entrevistas = this.entrevistas.filter(e => e.id !== id); },
      error: (err) => console.error('Error al eliminar entrevista:', err)
    });
  }

  goBack(): void { this.router.navigate(['/proyectos']); }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'numeric', year: 'numeric'
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