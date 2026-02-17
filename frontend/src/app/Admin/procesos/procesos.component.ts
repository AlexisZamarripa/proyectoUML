import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';
import { ProyectoApiService, Proyecto, EstadoProyecto } from '../../services/proyecto-api.service';
import { StakeholderApiService, Stakeholder } from '../../services/stakeholder-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

interface ColorOption {
  valor: string;
  hex: string;
  gradient: string;
}

@Component({
  selector: 'app-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent, ConfirmModalComponent],
  templateUrl: './procesos.component.html',
  styleUrls: ['./procesos.component.css']
})
export class ProcesosComponent implements OnInit {

  // Proyecto actual
  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  procesos: Proceso[] = [];
  stakeholders: Stakeholder[] = [];

  showForm = false;

  // Form fields
  nombre = '';
  descripcion = '';
  color = 'blue';
  stakeholder_id = '';
  departamentos: string[] = [];
  pasos_clave: string[] = [];
  
  // Temp inputs
  nuevoDepartamento = '';
  nuevoPaso = '';

  // Subproceso inline form
  addingSubprocesoToId: string | null = null;
  addingSubprocesoModal = false;
  subNombre = '';
  subDescripcion = '';
  subStakeholderId = '';

  // Modal
  selectedProceso: Proceso | null = null;

  // Confirm modal
  showConfirmModal = false;
  confirmModalConfig: ConfirmModalConfig = {
    title: '',
    message: '',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: 'trash'
  };
  private confirmCallback: (() => void) | null = null;

  activeTab = 'procesos';

  readonly COLORES: ColorOption[] = [
    { valor: 'blue', hex: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { valor: 'emerald', hex: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', hex: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
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
    private stakeholderApiService: StakeholderApiService,
    private procesoApiService: ProcesoApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto.nombre = p.nombre;
          this.proyecto.descripcion = p.descripcion;
          this.proyecto.color = p.color;
        },
        error: (error) => console.error('Error al cargar proyecto:', error)
      });
      
      // Cargar stakeholders del proyecto
      this.stakeholderApiService.getStakeholders(id).subscribe({
        next: (stakeholders) => {
          this.stakeholders = stakeholders;
        },
        error: (error) => console.error('Error al cargar stakeholders:', error)
      });

      // Cargar procesos del proyecto
      this.loadProcesos(id);
    }
  }

  loadProcesos(proyectoId: string): void {
    this.procesoApiService.getProcesosByProyecto(parseInt(proyectoId)).subscribe({
      next: (procesos) => {
        this.procesos = procesos;
      },
      error: (error) => console.error('Error al cargar procesos:', error)
    });
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  getProcesoGradient(colorValor: string): string {
    const c = this.COLORES.find(x => x.valor === colorValor);
    return c ? c.gradient : this.COLORES[0].gradient;
  }

  getProcesoColor(colorValor: string): string {
    const c = this.COLORES.find(x => x.valor === colorValor);
    return c ? c.hex : this.COLORES[0].hex;
  }

  // ===== FORM =====

  handleSubmit(): void {
    if (!this.nombre || !this.descripcion) return;

    const createDto = {
      id_proyecto: parseInt(this.proyecto.id),
      nombre_proceso: this.nombre,
      descripcion: this.descripcion,
      color: this.color,
      id_stakeholder: this.stakeholder_id ? parseInt(this.stakeholder_id) : null,
      departamentos: [...this.departamentos],
      pasos_clave: [...this.pasos_clave],
    };

    this.procesoApiService.createProceso(createDto).subscribe({
      next: () => {
        this.resetForm();
        this.loadProcesos(this.proyecto.id);
      },
      error: (error) => console.error('Error al crear proceso:', error)
    });
  }

  resetForm(): void {
    this.nombre = '';
    this.descripcion = '';
    this.color = 'blue';
    this.stakeholder_id = '';
    this.departamentos = [];
    this.pasos_clave = [];
    this.nuevoDepartamento = '';
    this.nuevoPaso = '';
    this.showForm = false;
  }

  // ===== DEPARTAMENTOS =====

  addDepartamento(): void {
    if (this.nuevoDepartamento.trim()) {
      this.departamentos.push(this.nuevoDepartamento.trim());
      this.nuevoDepartamento = '';
    }
  }

  removeDepartamento(index: number): void {
    this.departamentos.splice(index, 1);
  }

  // ===== PASOS CLAVE =====

  addPaso(): void {
    if (this.nuevoPaso.trim()) {
      this.pasos_clave.push(this.nuevoPaso.trim());
      this.nuevoPaso = '';
    }
  }

  removePaso(index: number): void {
    this.pasos_clave.splice(index, 1);
  }

  // ===== HELPERS =====

  getStakeholderNombre(id: string): string {
    const stakeholder = this.stakeholders.find(s => s.id === id);
    return stakeholder ? stakeholder.nombre : 'N/A';
  }

  deleteProceso(id: string, event: Event): void {
    event.stopPropagation();
    this.openConfirmModal(
      '¿Eliminar proceso?',
      '¿Estás seguro de que deseas eliminar este proceso y todos sus subprocesos? Esta acción no se puede deshacer.',
      () => {
        this.procesoApiService.deleteProceso(parseInt(id)).subscribe({
          next: () => {
            this.loadProcesos(this.proyecto.id);
          },
          error: (error) => console.error('Error al eliminar proceso:', error)
        });
      }
    );
  }

  // ===== SUBPROCESOS =====

  startAddSubproceso(procesoId: string): void {
    this.addingSubprocesoToId = procesoId;
    this.subNombre = '';
    this.subDescripcion = '';
    // Pre-seleccionar el stakeholder del proceso
    const proceso = this.procesos.find(p => p.id === procesoId);
    this.subStakeholderId = proceso?.stakeholder_id || '';
  }

  cancelAddSubproceso(): void {
    this.addingSubprocesoToId = null;
    this.subNombre = '';
    this.subDescripcion = '';
    this.subStakeholderId = '';
  }

  addSubproceso(procesoId: string): void {
    if (!this.subNombre) return;
    
    const createDto = {
      id_proyecto: parseInt(this.proyecto.id),
      id_proceso: parseInt(procesoId),
      nombre_subproceso: this.subNombre,
      descripcion: this.subDescripcion,
      id_stakeholder: this.subStakeholderId ? parseInt(this.subStakeholderId) : null,
    };

    this.procesoApiService.createSubproceso(createDto).subscribe({
      next: () => {
        this.cancelAddSubproceso();
        this.loadProcesos(this.proyecto.id);
      },
      error: (error) => console.error('Error al crear subproceso:', error)
    });
  }

  deleteSubproceso(procesoId: string, subId: string): void {
    this.openConfirmModal(
      '¿Eliminar subproceso?',
      '¿Estás seguro de que deseas eliminar este subproceso? Esta acción no se puede deshacer.',
      () => {
        this.procesoApiService.deleteSubproceso(parseInt(subId)).subscribe({
          next: () => {
            this.loadProcesos(this.proyecto.id);
          },
          error: (error) => console.error('Error al eliminar subproceso:', error)
        });
      }
    );
  }

  // ===== MODAL =====

  viewProceso(proceso: Proceso): void {
    this.selectedProceso = proceso;
    this.addingSubprocesoModal = false;
  }

  closeModal(): void {
    this.selectedProceso = null;
    this.addingSubprocesoModal = false;
    this.subNombre = '';
    this.subDescripcion = '';
    this.subStakeholderId = '';
  }

  startAddSubprocesoModal(): void {
    this.addingSubprocesoModal = true;
    this.subNombre = '';
    this.subDescripcion = '';
    // Pre-seleccion el stakeholder del proceso
    this.subStakeholderId = this.selectedProceso?.stakeholder_id || '';
  }

  cancelAddSubprocesoModal(): void {
    this.addingSubprocesoModal = false;
    this.subNombre = '';
    this.subDescripcion = '';
    this.subStakeholderId = '';
  }

  addSubprocesoFromModal(): void {
    if (!this.subNombre || !this.selectedProceso) return;
    
    const createDto = {
      id_proyecto: parseInt(this.proyecto.id),
      id_proceso: parseInt(this.selectedProceso.id),
      nombre_subproceso: this.subNombre,
      descripcion: this.subDescripcion,
      id_stakeholder: this.subStakeholderId ? parseInt(this.subStakeholderId) : null,
    };

    this.procesoApiService.createSubproceso(createDto).subscribe({
      next: () => {
        this.cancelAddSubprocesoModal();
        this.loadProcesos(this.proyecto.id);
        // Actualizar el proceso seleccionado en el modal
        const procesoActualizado = this.procesos.find(p => p.id === this.selectedProceso?.id);
        if (procesoActualizado) {
          this.selectedProceso = procesoActualizado;
        }
      },
      error: (error) => console.error('Error al crear subproceso:', error)
    });
  }

  deleteSubprocesoFromModal(subId: string): void {
    this.openConfirmModal(
      '¿Eliminar subproceso?',
      '¿Estás seguro de que deseas eliminar este subproceso? Esta acción no se puede deshacer.',
      () => {
        this.procesoApiService.deleteSubproceso(parseInt(subId)).subscribe({
          next: () => {
            this.loadProcesos(this.proyecto.id);
            // Actualizar el proceso seleccionado en el modal
            const procesoActualizado = this.procesos.find(p => p.id === this.selectedProceso?.id);
            if (procesoActualizado) {
              this.selectedProceso = procesoActualizado;
            }
          },
          error: (error) => console.error('Error al eliminar subproceso:', error)
        });
      }
    );
  }

  // ===== CONFIRM MODAL =====

  openConfirmModal(title: string, message: string, callback: () => void): void {
    this.confirmModalConfig = {
      title,
      message,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash'
    };
    this.confirmCallback = callback;
    this.showConfirmModal = true;
  }

  onConfirmModal(): void {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.showConfirmModal = false;
    this.confirmCallback = null;
  }

  onCancelModal(): void {
    this.showConfirmModal = false;
    this.confirmCallback = null;
  }
}
