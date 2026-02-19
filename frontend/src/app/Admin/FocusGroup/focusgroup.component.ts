import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { FocusGroupApiService, FocusGroup, CreateFocusGroupDto } from '../../services/FocusGroup.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

@Component({
  selector: 'app-focusgroup',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './focusgroup.component.html',
  styleUrls: ['./focusgroup.component.css']
})
export class FocusGroupComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };

  focusGroups: FocusGroup[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';

  activeTab = 'focus-groups';

  // Procesos y subprocesos
  procesosDisponibles: Proceso[] = [];
  subprocesosDisponibles: Subproceso[] = [];
  procesoVinculadoId = '';
  subprocesoId = '';

  // Form fields
  nombreFocus = '';
  descripcion = '';
  fechaInicio = '';
  estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' = 'planificacion';

  readonly ESTADOS = [
    { valor: 'planificacion', label: 'Planificación' },
    { valor: 'en_progreso', label: 'En Progreso' },
    { valor: 'pausado', label: 'Pausado' },
    { valor: 'completado', label: 'Completado' },
  ];

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
    private focusGroupApiService: FocusGroupApiService,
    private procesoApiService: ProcesoApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarFocusGroups();
          this.cargarProcesos();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga de datos ────────────────────────────────────────────────────────

  cargarFocusGroups(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.focusGroupApiService.getFocusGroups(idProyecto).subscribe({
      next: (data) => {
        this.focusGroups = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar focus groups:', err);
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

  // ─── Formulario ────────────────────────────────────────────────────────────

  handleSubmit(): void {
    if (!this.nombreFocus.trim()) return;
    if (!this.procesoVinculadoId || !this.subprocesoId) {
      this.errorMsg = 'Debes seleccionar un proceso y un subproceso.';
      return;
    }

    const dto: CreateFocusGroupDto = {
      id_proyecto: parseInt(this.proyecto.id, 10),
      id_proceso: parseInt(this.procesoVinculadoId, 10),
      id_subproceso: parseInt(this.subprocesoId, 10),
      nombre_focus: this.nombreFocus.trim(),
      descripcion: this.descripcion.trim() || undefined,
      fecha_inicio: this.fechaInicio || undefined,
      estado: this.estado
    };

    this.focusGroupApiService.createFocusGroup(dto).subscribe({
      next: (nuevo) => {
        this.focusGroups.push(nuevo);
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        console.error('Error al crear focus group:', err);
        this.errorMsg = 'Error al guardar el focus group. Intenta de nuevo.';
      }
    });
  }

  resetForm(): void {
    this.nombreFocus = '';
    this.descripcion = '';
    this.fechaInicio = '';
    this.estado = 'planificacion';
    this.procesoVinculadoId = '';
    this.subprocesoId = '';
    this.subprocesosDisponibles = [];
    this.errorMsg = '';
  }

  deleteFocusGroup(id: number): void {
    if (!confirm('¿Eliminar este focus group?')) return;
    this.focusGroupApiService.deleteFocusGroup(id).subscribe({
      next: () => {
        this.focusGroups = this.focusGroups.filter(fg => fg.id_focus !== id);
      },
      error: (err) => console.error('Error al eliminar focus group:', err)
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

  getEstadoLabel(estado?: string): string {
    return this.ESTADOS.find(e => e.valor === estado)?.label ?? 'Planificación';
  }

  getEstadoBadgeClass(estado?: string): string {
    const map: Record<string, string> = {
      planificacion: 'badge-gray',
      en_progreso: 'badge-blue',
      pausado: 'badge-orange',
      completado: 'badge-green'
    };
    return map[estado ?? ''] ?? 'badge-gray';
  }

  formatDate(fecha?: string): string {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}