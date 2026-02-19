import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { EntrevistaApiService, Entrevista } from '../../services/Entrevista-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

interface PreguntaForm {
  texto: string;
  respuesta: string;
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
  procesoNombre?: string;
  subprocesoNombre?: string;
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
  anotandoId: number | null = null;
  activeTab = 'entrevistas';

  // Procesos y subprocesos
  procesosDisponibles: Proceso[] = [];
  subprocesosDisponibles: Subproceso[] = [];

  // Form fields
  titulo = '';
  entrevistador = '';
  entrevistado = '';
  notas = '';
  procesoVinculadoId = '';
  subprocesoId = '';
  preguntas: PreguntaForm[] = [{ texto: '', respuesta: '' }];

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
    private entrevistaApiService: EntrevistaApiService,
    private procesoApiService: ProcesoApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarEntrevistas();
          this.cargarProcesos();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga de datos ────────────────────────────────────────────────────────

  cargarEntrevistas(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.entrevistaApiService.getEntrevistas(idProyecto).subscribe({
      next: (data: Entrevista[]) => {
        this.entrevistas = data.map((e: Entrevista) => ({
          ...e,
          estado: 'pendiente' as const,
          conRespuestas: e.preguntas.some(p => p.respuesta && p.respuesta.trim()),
          archivos: [],
          fecha: new Date().toISOString().split('T')[0],
          procesoNombre: undefined,
          subprocesoNombre: undefined
        }));
        // Marcar como realizada si tiene respuestas
        this.entrevistas.forEach(e => {
          if (e.conRespuestas) e.estado = 'realizada';
        });
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error al cargar entrevistas:', err);
        this.isLoading = false;
      }
    });
  }

  cargarProcesos(): void {
    const idProyecto = parseInt(this.proyecto.id, 10);
    if (!idProyecto) return;
    this.procesoApiService.getProcesosByProyecto(idProyecto).subscribe({
      next: (data) => {
        // La interfaz Proceso ya tiene id, nombre y subprocesos con id y nombre
        this.procesosDisponibles = data;
      },
      error: (err: unknown) => console.error('Error al cargar procesos:', err)
    });
  }

  onProcesoChange(): void {
    this.subprocesoId = '';
    if (!this.procesoVinculadoId) {
      this.subprocesosDisponibles = [];
      return;
    }
    const proceso = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
    if (proceso) {
      this.subprocesosDisponibles = proceso.subprocesos || [];
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  get totalEntrevistas(): number { return this.entrevistas.length; }
  get realizadas(): number { return this.entrevistas.filter(e => e.estado === 'realizada').length; }
  get pendientes(): number { return this.entrevistas.filter(e => e.estado === 'pendiente').length; }
  get entrevistasRealizadas(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'realizada'); }
  get entrevistasPendientes(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'pendiente'); }

  // ─── Formulario ────────────────────────────────────────────────────────────

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  handleSubmit(): void {
    if (!this.titulo || !this.entrevistador || !this.entrevistado) return;
    if (!this.procesoVinculadoId || !this.subprocesoId) {
      this.errorMsg = 'Debes seleccionar un proceso y un subproceso.';
      return;
    }

    const procesoSeleccionado = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
    const subprocesoSeleccionado = this.subprocesosDisponibles.find(s => s.id === this.subprocesoId);

    const dto = {
      id_proyecto: parseInt(this.proyecto.id, 10),
      id_proceso: parseInt(this.procesoVinculadoId, 10),
      id_subproceso: parseInt(this.subprocesoId, 10),
      titulo_entrevista: this.titulo.trim(),
      entrevistador: this.entrevistador.trim(),
      entrevistado: this.entrevistado.trim(),
      notas_contexto: this.notas.trim(),
      preguntas: this.preguntas
        .filter((p: PreguntaForm) => p.texto.trim())
        .map((p: PreguntaForm) => ({ pregunta: p.texto }))
    };

    this.entrevistaApiService.createEntrevista(dto).subscribe({
      next: (nueva: Entrevista) => {
        const nuevaUI: EntrevistaUI = {
          ...nueva,
          estado: 'pendiente',
          conRespuestas: false,
          archivos: [],
          fecha: new Date().toISOString().split('T')[0],
          procesoNombre: procesoSeleccionado?.nombre,
          subprocesoNombre: subprocesoSeleccionado?.nombre
        };
        this.entrevistas.push(nuevaUI);
        this.resetForm();
        this.showForm = false;
      },
      error: (err: unknown) => {
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
    this.procesoVinculadoId = '';
    this.subprocesoId = '';
    this.subprocesosDisponibles = [];
    this.preguntas = [{ texto: '', respuesta: '' }];
    this.errorMsg = '';
  }

  addPregunta(): void {
    this.preguntas.push({ texto: '', respuesta: '' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) this.preguntas.splice(index, 1);
  }

  // ─── Anotaciones ───────────────────────────────────────────────────────────

  startAnotar(entrevistaId: number): void {
    this.anotandoId = entrevistaId;
  }

  cancelAnotar(): void {
    this.anotandoId = null;
  }

  guardarRespuestas(entrevista: EntrevistaUI): void {
    const tieneRespuestas = entrevista.preguntas.some(p => p.respuesta && p.respuesta.trim());
    entrevista.conRespuestas = tieneRespuestas;
    if (tieneRespuestas) entrevista.estado = 'realizada';
    this.anotandoId = null;

    // Aquí podrías hacer un PATCH al backend para guardar las respuestas
    // this.entrevistaApiService.updateEntrevista(entrevista.id_entrevista, { preguntas: ... })
  }

  // ─── Archivos ──────────────────────────────────────────────────────────────

  onFileSelect(event: Event, entrevistaId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const entrevista = this.entrevistas.find(e => e.id_entrevista === entrevistaId);
      if (entrevista) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          entrevista.archivos.push({
            id: this.generateUUID(),
            nombre: file.name,
            tipo: file.type
          });
        }
      }
    }
  }

  removeArchivo(entrevistaId: number, archivoId: string): void {
    const entrevista = this.entrevistas.find(e => e.id_entrevista === entrevistaId);
    if (entrevista) {
      entrevista.archivos = entrevista.archivos.filter(a => a.id !== archivoId);
    }
  }

  deleteEntrevista(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar esta entrevista?')) return;
    this.entrevistaApiService.deleteEntrevista(id).subscribe({
      next: () => {
        this.entrevistas = this.entrevistas.filter(e => e.id_entrevista !== id);
      },
      error: (err: unknown) => console.error('Error al eliminar entrevista:', err)
    });
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}