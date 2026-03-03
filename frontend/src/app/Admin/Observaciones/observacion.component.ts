import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { ObservacionApiService, Observacion, CreateObservacionDto } from '../../services/Observacion-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

interface ObservacionUI extends Observacion {
  fecha: string;
}

@Component({
  selector: 'app-observacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './observacion.component.html',
  styleUrls: ['./observacion.component.css']
})
export class ObservacionComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };

  activeTab = 'observaciones';

  observaciones: ObservacionUI[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';

  // ── Modal: Ver ────────────────────────────────────────────────────────────
  viewingObs: ObservacionUI | null = null;

  // ── Edición ───────────────────────────────────────────────────────────────
  /** ID de la observación que se está editando; null si es creación nueva */
  editingId: number | null = null;

  // Procesos y subprocesos
  procesosDisponibles: Proceso[] = [];
  subprocesosDisponibles: Subproceso[] = [];
  procesoVinculadoId = '';
  subprocesoId = '';

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
  textoObservaciones = '';
  hallazgos: string[] = [];
  tempHallazgo = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private observacionApiService: ObservacionApiService,
    private procesoApiService: ProcesoApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarObservaciones();
          this.cargarProcesos();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga de datos ────────────────────────────────────────────────────────

  cargarObservaciones(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.observacionApiService.getObservaciones(idProyecto).subscribe({
      next: (data) => {
        this.observaciones = data.map(o => ({
          ...o,
          fecha: o.fecha ?? new Date().toISOString().split('T')[0]
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar observaciones:', err);
        this.isLoading = false;
      }
    });
  }

  cargarProcesos(): void {
    const idProyecto = parseInt(this.proyecto.id, 10);
    if (!idProyecto) return;
    this.procesoApiService.getProcesosByProyecto(idProyecto).subscribe({
      next: (data) => { this.procesosDisponibles = data; },
      error: (err) => console.error('Error al cargar procesos:', err)
    });
  }

  onProcesoChange(): void {
    this.subprocesoId = '';
    if (!this.procesoVinculadoId) {
      this.subprocesosDisponibles = [];
      return;
    }
    const proceso = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
    this.subprocesosDisponibles = proceso?.subprocesos || [];
  }

  // ─── Modal: Ver ────────────────────────────────────────────────────────────

  viewObservacion(obs: ObservacionUI): void {
    this.viewingObs = obs;
  }

  closeViewModal(): void {
    this.viewingObs = null;
  }

  /** Convierte la cadena "a | b | c" en un arreglo ["a", "b", "c"] */
  getHallazgosArray(raw: string): string[] {
    return raw.split('|').map(h => h.trim()).filter(h => h.length > 0);
  }

  /** Devuelve el nombre del proceso dado su ID */
  getNombreProceso(idProceso: number): string {
    const p = this.procesosDisponibles.find(x => x.id === String(idProceso));
    return p ? p.nombre : `Proceso ${idProceso}`;
  }

  /** Devuelve el nombre del subproceso dado el ID del proceso y del subproceso */
  getNombreSubproceso(idProceso: number, idSubproceso: number): string {
    const p = this.procesosDisponibles.find(x => x.id === String(idProceso));
    if (!p) return `Subproceso ${idSubproceso}`;
    const s = p.subprocesos?.find((x: Subproceso) => x.id === String(idSubproceso));
    return s ? s.nombre : `Subproceso ${idSubproceso}`;
  }

  // ─── Formulario (Crear / Editar) ───────────────────────────────────────────

  /**
   * Abre el formulario cargando los datos de la observación seleccionada.
   * También precarga los subprocesos del proceso correspondiente.
   */
  editObservacion(obs: ObservacionUI): void {
    this.editingId = obs.id_observacion;

    this.titulo = obs.titulo;
    this.textoObservaciones = obs.observaciones;
    this.hallazgos = obs.hallazgos_puntos_clave
      ? this.getHallazgosArray(obs.hallazgos_puntos_clave)
      : [];
    this.tempHallazgo = '';

    // Pre-seleccionar proceso y subproceso
    this.procesoVinculadoId = obs.id_proceso ? String(obs.id_proceso) : '';
    if (this.procesoVinculadoId) {
      const proceso = this.procesosDisponibles.find(
        p => p.id === this.procesoVinculadoId
      );
      this.subprocesosDisponibles = proceso?.subprocesos || [];
    }
    this.subprocesoId = obs.id_subproceso ? String(obs.id_subproceso) : '';

    this.errorMsg = '';
    this.showForm = true;
  }

  cancelForm(): void {
    this.resetForm();
    this.showForm = false;
  }

  handleSubmit(): void {
    if (!this.titulo.trim() || !this.textoObservaciones.trim()) return;
    if (!this.procesoVinculadoId || !this.subprocesoId) {
      this.errorMsg = 'Debes seleccionar un proceso y un subproceso.';
      return;
    }

    const dto: CreateObservacionDto = {
      id_proyecto: parseInt(this.proyecto.id, 10),
      id_proceso: parseInt(this.procesoVinculadoId, 10),
      id_subproceso: parseInt(this.subprocesoId, 10),
      titulo: this.titulo.trim(),
      observaciones: this.textoObservaciones.trim(),
      hallazgos_puntos_clave: this.hallazgos.filter(h => h.trim()).join(' | ')
    };

    if (this.editingId !== null) {
      // ── EDITAR ────────────────────────────────────────────────────────────
      this.observacionApiService.updateObservacion(this.editingId, dto).subscribe({
        next: (actualizada: Observacion) => {
          const idx = this.observaciones.findIndex(
            o => o.id_observacion === this.editingId
          );
          if (idx !== -1) {
            this.observaciones[idx] = {
              ...actualizada,
              fecha: actualizada.fecha ?? new Date().toISOString().split('T')[0]
            };
          }
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          console.error('Error al actualizar observación:', err);
          this.errorMsg = 'Error al actualizar la observación. Intenta de nuevo.';
        }
      });
    } else {
      // ── CREAR ─────────────────────────────────────────────────────────────
      this.observacionApiService.createObservacion(dto).subscribe({
        next: (nueva) => {
          this.observaciones.push({
            ...nueva,
            fecha: nueva.fecha ?? new Date().toISOString().split('T')[0]
          });
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          console.error('Error al crear observación:', err);
          this.errorMsg = 'Error al guardar la observación. Intenta de nuevo.';
        }
      });
    }
  }

  resetForm(): void {
    this.titulo = '';
    this.textoObservaciones = '';
    this.hallazgos = [];
    this.tempHallazgo = '';
    this.procesoVinculadoId = '';
    this.subprocesoId = '';
    this.subprocesosDisponibles = [];
    this.errorMsg = '';
    this.editingId = null;
  }

  addHallazgo(): void {
    if (this.tempHallazgo.trim()) {
      this.hallazgos.push(this.tempHallazgo.trim());
      this.tempHallazgo = '';
    }
  }

  removeHallazgo(index: number): void {
    this.hallazgos.splice(index, 1);
  }

  deleteObservacion(id: number): void {
    if (!confirm('¿Eliminar esta observación?')) return;
    this.observacionApiService.deleteObservacion(id).subscribe({
      next: () => {
        this.observaciones = this.observaciones.filter(o => o.id_observacion !== id);
      },
      error: (err) => console.error('Error al eliminar observación:', err)
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}