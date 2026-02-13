import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProyectoApiService, Proyecto, EstadoProyecto, Stakeholder } from '../../services/proyecto-api.service';
import { StakeholderApiService } from '../../services/stakeholder-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';

interface ColorProyecto {
  valor: string;
  gradient: string;
  label: string;
}

interface EstadoInfo {
  iconPath: string;
  colorClass: string;
  bgClass: string;
  label: string;
}

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './proyecto.component.html',
  styleUrls: ['./proyecto.component.css']
})
export class ProyectosComponent implements OnInit {

  proyectos: Proyecto[] = [];
  entrevistas: { proyectoId: string }[] = [];
  encuestas: { proyectoId: string }[] = [];
  observaciones: { proyectoId: string }[] = [];

  showForm = false;
  selectedProyecto: Proyecto | null = null;
  editingProyecto: Proyecto | null = null;

  // Confirm modal state
  showConfirmModal = false;
  confirmModalConfig: ConfirmModalConfig = {
    title: '',
    message: '',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: 'trash'
  };
  proyectoToDelete: string | null = null;

  // Form state
  nombre = '';
  descripcion = '';
  fechaInicio = new Date().toISOString().split('T')[0];
  estado: EstadoProyecto = 'en-progreso';
  color = 'blue';

  // Edit form state
  editNombre = '';
  editDescripcion = '';
  editFechaInicio = '';
  editEstado: EstadoProyecto = 'en-progreso';
  editColor = 'blue';

  readonly COLORES_PROYECTO: ColorProyecto[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', label: 'Azul' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)', label: 'Verde' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', label: 'Púrpura' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)', label: 'Naranja' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', label: 'Rosa' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', label: 'Índigo' },
  ];

  constructor(
    private router: Router, 
    private proyectoApiService: ProyectoApiService,
    private stakeholderApiService: StakeholderApiService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.proyectoApiService.getProyectos().subscribe({
      next: (data) => {
        this.proyectos = data;
      },
      error: (error) => console.error('Error al cargar proyectos:', error)
    });
  }

  handleSubmit(): void {
    if (!this.nombre || !this.descripcion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const nuevoProyecto: Omit<Proyecto, 'id' | 'stakeholders' | 'procesos'> = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaInicio: this.fechaInicio,
      estado: this.estado,
      color: this.color,
    };

    this.proyectoApiService.createProyecto(nuevoProyecto).subscribe({
      next: (proyecto) => {
        this.proyectos.push(proyecto);
        this.resetForm();
        this.showForm = false;
      },
      error: (error) => console.error('Error al crear proyecto:', error)
    });
  }

  resetForm(): void {
    this.nombre = '';
    this.descripcion = '';
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.estado = 'en-progreso';
    this.color = 'blue';
  }

  getEstadoInfo(estado: string): EstadoInfo {
    const estadoMap: { [key: string]: EstadoInfo } = {
      'en-progreso': {
        iconPath: '✓',
        colorClass: 'estado-progreso',
        bgClass: 'estado-bg-progreso',
        label: 'En progreso'
      },
      'planificacion': {
        iconPath: '◉',
        colorClass: 'estado-planificacion',
        bgClass: 'estado-bg-planificacion',
        label: 'Planificación'
      },
      'completado': {
        iconPath: '✓',
        colorClass: 'estado-completado',
        bgClass: 'estado-bg-completado',
        label: 'Completado'
      },
      'pausado': {
        iconPath: '⏸',
        colorClass: 'estado-pausado',
        bgClass: 'estado-bg-pausado',
        label: 'Pausado'
      }
    };
    return estadoMap[estado] || estadoMap['en-progreso'];
  }

  getProyectoAnalisis(proyecto: Proyecto): number {
    return this.entrevistas.filter(e => e.proyectoId === proyecto.id).length +
           this.encuestas.filter(e => e.proyectoId === proyecto.id).length +
           this.observaciones.filter(e => e.proyectoId === proyecto.id).length;
  }

  getGradient(colorValor: string): string {
    const color = this.COLORES_PROYECTO.find(c => c.valor === colorValor);
    return color ? color.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  deleteProyecto(id: string, event: Event): void {
    event.stopPropagation();
    const proyecto = this.proyectos.find(p => p.id === id);
    
    this.proyectoToDelete = id;
    this.confirmModalConfig = {
      title: '¿Eliminar proyecto?',
      message: `¿Estás seguro de que deseas eliminar el proyecto "${proyecto?.nombre}"? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash'
    };
    this.showConfirmModal = true;
  }

  confirmDelete(): void {
    if (this.proyectoToDelete) {
      this.proyectoApiService.deleteProyecto(this.proyectoToDelete).subscribe({
        next: () => {
          this.proyectos = this.proyectos.filter(p => p.id !== this.proyectoToDelete);
          this.showConfirmModal = false;
          this.proyectoToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar proyecto:', error);
          this.showConfirmModal = false;
          this.proyectoToDelete = null;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmModal = false;
    this.proyectoToDelete = null;
  }

  openPreview(proyecto: Proyecto, event: Event): void {
    event.stopPropagation();
    this.selectedProyecto = proyecto;
  }

  selectProyecto(proyectoId: string): void {
    const proyecto = this.proyectos.find(p => p.id === proyectoId);
    if (proyecto) {
      this.router.navigate(['/proyecto', proyectoId, 'stakeholders']);
    }
  }

  closeModal(): void {
    this.selectedProyecto = null;
  }

  openEditModal(proyecto: Proyecto, event: Event): void {
    event.stopPropagation();
    this.editingProyecto = proyecto;
    this.editNombre = proyecto.nombre;
    this.editDescripcion = proyecto.descripcion;
    // Asegurar que la fecha esté en formato YYYY-MM-DD para el input date
    this.editFechaInicio = proyecto.fechaInicio?.split('T')[0] || proyecto.fechaInicio;
    this.editEstado = proyecto.estado;
    this.editColor = proyecto.color;
  }

  closeEditModal(): void {
    this.editingProyecto = null;
    this.editNombre = '';
    this.editDescripcion = '';
    this.editFechaInicio = '';
    this.editEstado = 'en-progreso';
    this.editColor = 'blue';
  }

  handleEditSubmit(): void {
    if (!this.editingProyecto || !this.editNombre || !this.editDescripcion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const updatedData: Partial<Proyecto> = {
      nombre: this.editNombre,
      descripcion: this.editDescripcion,
      fechaInicio: this.editFechaInicio,
      estado: this.editEstado,
      color: this.editColor
    };

    console.log('Datos a actualizar:', updatedData);
    
    this.proyectoApiService.updateProyecto(this.editingProyecto.id, updatedData).subscribe({
      next: (proyectoActualizado) => {
        const index = this.proyectos.findIndex(p => p.id === this.editingProyecto!.id);
        if (index !== -1) {
          this.proyectos[index] = proyectoActualizado;
        }
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error al actualizar proyecto:', error);
        if (error.error) {
          console.error('Detalles del error:', error.error);
        }
        alert('Error al actualizar el proyecto. Revisa la consola para más detalles.');
      }
    });
  }

  openAndClose(): void {
    this.showForm = !this.showForm;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDateLong(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get totalAnalisis(): number {
    return this.entrevistas.length + this.encuestas.length + this.observaciones.length;
  }

  get proyectosEnProgreso(): number {
    return this.proyectos.filter(p => p.estado === 'en-progreso').length;
  }

  get proyectosCompletados(): number {
    return this.proyectos.filter(p => p.estado === 'completado').length;
  }
}
