import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { FocusGroupApiService, FocusGroup, CreateFocusGroupDto } from '../../services/FocusGroup.service';

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

  // Form fields (crear)
  nombreFocus = '';
  descripcion = '';
  fechaInicio = '';
  fechaFin = '';
  modalidad: 'presencial' | 'virtual' | 'hibrido' | '' = '';
  lugar = '';
  numeroParticipantes: number | null = null;
  moderador = '';
  estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' = 'planificacion';
  conclusiones = '';

  // Modal edición / vista
  selectedFg: FocusGroup | null = null;
  modalReadOnly = false;
  editErrorMsg = '';
  savingEdit = false;
  editGuardado = false;

  // Form fields (editar) — espejo del selected
  editNombre = '';
  editDescripcion = '';
  editFechaInicio = '';
  editFechaFin = '';
  editModalidad: 'presencial' | 'virtual' | 'hibrido' | '' = '';
  editLugar = '';
  editNumeroParticipantes: number | null = null;
  editModerador = '';
  editEstado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' = 'planificacion';
  editConclusiones = '';

  readonly ESTADOS = [
    { valor: 'planificacion', label: 'Planificación' },
    { valor: 'en_progreso', label: 'En Progreso' },
    { valor: 'pausado', label: 'Pausado' },
    { valor: 'completado', label: 'Completado' },
  ];

  readonly MODALIDADES = [
    { valor: 'presencial', label: 'Presencial' },
    { valor: 'virtual', label: 'Virtual' },
    { valor: 'hibrido', label: 'Híbrido' },
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
    private focusGroupApiService: FocusGroupApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarFocusGroups();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga ────────────────────────────────────────────────────────────────

  cargarFocusGroups(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.focusGroupApiService.getFocusGroups(idProyecto).subscribe({
      next: (data) => { this.focusGroups = data; this.isLoading = false; },
      error: (err) => { console.error('Error al cargar focus groups:', err); this.isLoading = false; }
    });
  }

  // ─── Crear ────────────────────────────────────────────────────────────────

  handleSubmit(): void {
    if (!this.nombreFocus.trim()) return;

    const dto: CreateFocusGroupDto = {
      id_proyecto: parseInt(this.proyecto.id, 10),
      nombre_focus: this.nombreFocus.trim(),
      descripcion: this.descripcion.trim() || undefined,
      fecha_inicio: this.fechaInicio || undefined,
      fecha_fin: this.fechaFin || undefined,
      modalidad: this.modalidad || undefined,
      lugar: this.lugar.trim() || undefined,
      numero_participantes: this.numeroParticipantes ?? undefined,
      moderador: this.moderador.trim() || undefined,
      estado: this.estado,
      conclusiones: this.conclusiones.trim() || undefined,
    };

    this.focusGroupApiService.createFocusGroup(dto).subscribe({
      next: (nuevo) => { this.focusGroups.push(nuevo); this.resetForm(); this.showForm = false; },
      error: (err) => { console.error('Error al crear focus group:', err); this.errorMsg = 'Error al guardar. Intenta de nuevo.'; }
    });
  }

  resetForm(): void {
    this.nombreFocus = ''; this.descripcion = ''; this.fechaInicio = '';
    this.fechaFin = ''; this.modalidad = ''; this.lugar = '';
    this.numeroParticipantes = null; this.moderador = '';
    this.estado = 'planificacion'; this.conclusiones = ''; this.errorMsg = '';
  }

  // ─── Modal ver / editar ───────────────────────────────────────────────────

  openVerModal(fg: FocusGroup): void {
    this.selectedFg = fg;
    this.modalReadOnly = true;
    this.editGuardado = false;
    this.editErrorMsg = '';
    this.loadEditForm(fg);
  }

  openEditModal(fg: FocusGroup): void {
    this.selectedFg = fg;
    this.modalReadOnly = false;
    this.editGuardado = false;
    this.editErrorMsg = '';
    this.loadEditForm(fg);
  }

  private loadEditForm(fg: FocusGroup): void {
    this.editNombre = fg.nombre_focus ?? '';
    this.editDescripcion = fg.descripcion ?? '';
    this.editFechaInicio = fg.fecha_inicio ?? '';
    this.editFechaFin = fg.fecha_fin ?? '';
    this.editModalidad = fg.modalidad ?? '';
    this.editLugar = fg.lugar ?? '';
    this.editNumeroParticipantes = fg.numero_participantes ?? null;
    this.editModerador = fg.moderador ?? '';
    this.editEstado = fg.estado ?? 'planificacion';
    this.editConclusiones = fg.conclusiones ?? '';
  }

  closeModal(): void {
    this.selectedFg = null;
    this.editGuardado = false;
    this.editErrorMsg = '';
    this.savingEdit = false;
  }

  saveEdit(): void {
    if (!this.selectedFg || !this.editNombre.trim()) return;
    this.savingEdit = true;
    this.editGuardado = false;

    const dto = {
      nombre_focus: this.editNombre.trim(),
      descripcion: this.editDescripcion.trim() || undefined,
      fecha_inicio: this.editFechaInicio || undefined,
      fecha_fin: this.editFechaFin || undefined,
      modalidad: this.editModalidad || undefined,
      lugar: this.editLugar.trim() || undefined,
      numero_participantes: this.editNumeroParticipantes ?? undefined,
      moderador: this.editModerador.trim() || undefined,
      estado: this.editEstado,
      conclusiones: this.editConclusiones.trim() || undefined,
    };

    this.focusGroupApiService.updateFocusGroup(this.selectedFg.id_focus, dto).subscribe({
      next: (actualizado) => {
        const idx = this.focusGroups.findIndex(fg => fg.id_focus === actualizado.id_focus);
        if (idx !== -1) this.focusGroups[idx] = actualizado;
        this.savingEdit = false;
        this.editGuardado = true;
        setTimeout(() => this.editGuardado = false, 3000);
      },
      error: (err) => {
        console.error('Error al actualizar focus group:', err);
        this.editErrorMsg = 'Error al guardar. Intenta de nuevo.';
        this.savingEdit = false;
      }
    });
  }

  // ─── Eliminar ─────────────────────────────────────────────────────────────

  deleteFocusGroup(id: number): void {
    if (!confirm('¿Eliminar este focus group?')) return;
    this.focusGroupApiService.deleteFocusGroup(id).subscribe({
      next: () => { this.focusGroups = this.focusGroups.filter(fg => fg.id_focus !== id); },
      error: (err) => console.error('Error al eliminar focus group:', err)
    });
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/proyectos']); }

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

  getModalidadLabel(modalidad?: string): string {
    return this.MODALIDADES.find(m => m.valor === modalidad)?.label ?? '';
  }

  formatDate(fecha?: string): string {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}