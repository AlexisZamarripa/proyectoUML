import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { EncuestaApiService, Encuesta, TipoPregunta } from '../../services/encuesta-api.service';
import { ProcesoApiService, Proceso } from '../../services/proceso-api.service';
import { SubprocesoApiService, Subproceso } from '../../services/subproceso-api.service';

interface PreguntaForm {
  texto: string;
  tipo: TipoPregunta;
}

interface EncuestaUI extends Encuesta {
  estado: 'borrador' | 'activa' | 'cerrada';
  fecha: string;
  participantesReales: number;
  procesoNombre?: string;
  subprocesoNombre?: string;
}

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit {

  proyecto = { id: 0, nombre: '', descripcion: '', color: 'blue' };

  activeTab = 'encuestas';
  encuestas: EncuestaUI[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';

  // Procesos y subprocesos
  procesos: Proceso[] = [];
  subprocesos: Subproceso[] = [];
  isLoadingProcesos = false;
  isLoadingSubprocesos = false;

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  // Form fields
  titulo = '';
  descripcion = '';
  participantesEsperados = 0;
  procesoId: number | null = null;
  subprocesoId: number | null = null;
  preguntas: PreguntaForm[] = [{ texto: '', tipo: 'texto_abierto' }];

  TIPOS_PREGUNTA: { valor: TipoPregunta; label: string }[] = [
    { valor: 'texto_abierto', label: 'Texto abierto' },
    { valor: 'opcion_multiple', label: 'Opción múltiple' },
    { valor: 'escala', label: 'Escala (1-5)' },
    { valor: 'si_no', label: 'Sí / No' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private encuestaApiService: EncuestaApiService,
    private procesoApiService: ProcesoApiService,
    private subprocesoApiService: SubprocesoApiService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(idParam).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarEncuestas();
          this.cargarProcesos();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga de datos ────────────────────────────────────────────────────────

  cargarEncuestas(): void {
    this.isLoading = true;
    this.encuestaApiService.getEncuestas(this.proyecto.id).subscribe({
      next: (data) => {
        this.encuestas = data.map(e => ({
          ...e,
          estado: 'activa' as const,
          fecha: new Date().toISOString().split('T')[0],
          participantesReales: 0,
          procesoNombre: undefined,
          subprocesoNombre: undefined
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar encuestas:', err);
        this.isLoading = false;
      }
    });
  }

  cargarProcesos(): void {
    this.isLoadingProcesos = true;
    this.procesoApiService.getProcesos(this.proyecto.id).subscribe({
      next: (data) => {
        this.procesos = data;
        this.isLoadingProcesos = false;
      },
      error: (err) => {
        console.error('Error al cargar procesos:', err);
        this.isLoadingProcesos = false;
      }
    });
  }

  onProcesoChange(value: string): void {
    this.subprocesoId = null;
    this.subprocesos = [];

    const id = parseInt(value, 10);
    if (!id) { this.procesoId = null; return; }

    this.procesoId = id;
    this.isLoadingSubprocesos = true;
    this.subprocesoApiService.getSubprocesos(id).subscribe({
      next: (data) => {
        this.subprocesos = data;
        this.isLoadingSubprocesos = false;
      },
      error: (err) => {
        console.error('Error al cargar subprocesos:', err);
        this.isLoadingSubprocesos = false;
      }
    });
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  get totalEncuestas(): number { return this.encuestas.length; }
  get borradores(): number { return this.encuestas.filter(e => e.estado === 'borrador').length; }
  get activas(): number { return this.encuestas.filter(e => e.estado === 'activa').length; }
  get cerradas(): number { return this.encuestas.filter(e => e.estado === 'cerrada').length; }

  get encuestasBorrador(): EncuestaUI[] { return this.encuestas.filter(e => e.estado === 'borrador'); }
  get encuestasActivas(): EncuestaUI[] { return this.encuestas.filter(e => e.estado === 'activa'); }
  get encuestasCerradas(): EncuestaUI[] { return this.encuestas.filter(e => e.estado === 'cerrada'); }

  // ─── Formulario ────────────────────────────────────────────────────────────

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  handleSubmit(): void {
    if (!this.titulo.trim() || !this.descripcion.trim()) return;
    if (!this.procesoId || !this.subprocesoId) {
      this.errorMsg = 'Debes seleccionar un proceso y un subproceso.';
      return;
    }

    const dto = {
      id_proyecto: this.proyecto.id,
      id_proceso: this.procesoId,
      id_subproceso: this.subprocesoId,
      titulo_encuesta: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      numero_participantes_esperados: this.participantesEsperados,
      preguntas: this.preguntas
        .filter(p => p.texto.trim())
        .map(p => ({ pregunta: p.texto, tipo_pregunta: p.tipo }))
    };

    this.encuestaApiService.createEncuesta(dto).subscribe({
      next: (nueva) => {
        const procesoObj = this.procesos.find(p => p.id === this.procesoId);
        const subprocesoObj = this.subprocesos.find(s => s.id === this.subprocesoId);

        const nuevaUI: EncuestaUI = {
          ...nueva,
          estado: 'borrador',
          fecha: new Date().toISOString().split('T')[0],
          participantesReales: 0,
          procesoNombre: procesoObj?.nombre,
          subprocesoNombre: subprocesoObj?.nombre,
        };
        this.encuestas.push(nuevaUI);
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        console.error('Error al crear encuesta:', err);
        this.errorMsg = 'Error al crear la encuesta. Intenta de nuevo.';
      }
    });
  }

  resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.participantesEsperados = 0;
    this.procesoId = null;
    this.subprocesoId = null;
    this.subprocesos = [];
    this.preguntas = [{ texto: '', tipo: 'texto_abierto' }];
    this.errorMsg = '';
  }

  addPregunta(): void {
    this.preguntas.push({ texto: '', tipo: 'texto_abierto' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) this.preguntas.splice(index, 1);
  }

  deleteEncuesta(id: number): void {
    if (!confirm('¿Eliminar esta encuesta?')) return;
    this.encuestaApiService.deleteEncuesta(id).subscribe({
      next: () => { this.encuestas = this.encuestas.filter(e => e.id_encuesta !== id); },
      error: (err) => console.error('Error al eliminar encuesta:', err)
    });
  }

  activarEncuesta(id: number): void {
    const enc = this.encuestas.find(e => e.id_encuesta === id);
    if (enc) enc.estado = 'activa';
  }

  cerrarEncuesta(id: number): void {
    const enc = this.encuestas.find(e => e.id_encuesta === id);
    if (enc) enc.estado = 'cerrada';
  }

  goBack(): void { this.router.navigate(['/proyectos']); }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}