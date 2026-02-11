import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService, Proyecto, EstadoProyecto } from '../../services/proyecto-api.service';
interface Subproceso {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Departamento {
  nombre: string;
}

interface Proceso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  stakeholder: string;
  departamentos: Departamento[];
  plazoClave: string[];
  peso: number;
  subprocesos: Subproceso[];
}

interface ColorOption {
  valor: string;
  hex: string;
  gradient: string;
}

@Component({
  selector: 'app-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
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

  showForm = false;

  // Form fields
  nombre = '';
  descripcion = '';
  color = 'blue';
  stakeholder = '';
  peso: number = 1;
  departamentos: Departamento[] = [];
  plazoClave: string[] = [];
  tempDepartamento = '';
  tempPlazoClave = '';

  // Subproceso inline form
  addingSubprocesoToId: string | null = null;
  addingSubprocesoModal = false;
  subNombre = '';
  subDescripcion = '';

  // Modal
  selectedProceso: Proceso | null = null;

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

  constructor(private router: Router, private route: ActivatedRoute, private proyectoApiService: ProyectoApiService) {}

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
    }
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

    const nuevo: Proceso = {
      id: this.generateUUID(),
      nombre: this.nombre,
      descripcion: this.descripcion,
      color: this.color,
      stakeholder: this.stakeholder,
      departamentos: [...this.departamentos],
      plazoClave: [...this.plazoClave],
      peso: this.peso,
      subprocesos: [],
    };

    this.procesos.push(nuevo);
    this.resetForm();
  }

  resetForm(): void {
    this.nombre = '';
    this.descripcion = '';
    this.color = 'blue';
    this.stakeholder = '';
    this.peso = 1;
    this.departamentos = [];
    this.plazoClave = [];
    this.tempDepartamento = '';
    this.tempPlazoClave = '';
    this.showForm = false;
  }

  addDepartamento(): void {
    if (this.tempDepartamento.trim()) {
      this.departamentos.push({ nombre: this.tempDepartamento.trim() });
      this.tempDepartamento = '';
    }
  }

  removeDepartamento(index: number): void {
    this.departamentos.splice(index, 1);
  }

  addPlazoClave(): void {
    if (this.tempPlazoClave.trim()) {
      this.plazoClave.push(this.tempPlazoClave.trim());
      this.tempPlazoClave = '';
    }
  }

  removePlazoClave(index: number): void {
    this.plazoClave.splice(index, 1);
  }

  deleteProceso(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Eliminar este proceso y todos sus subprocesos?')) {
      this.procesos = this.procesos.filter(p => p.id !== id);
    }
  }

  // ===== SUBPROCESOS =====

  startAddSubproceso(procesoId: string): void {
    this.addingSubprocesoToId = procesoId;
    this.subNombre = '';
    this.subDescripcion = '';
  }

  cancelAddSubproceso(): void {
    this.addingSubprocesoToId = null;
    this.subNombre = '';
    this.subDescripcion = '';
  }

  addSubproceso(procesoId: string): void {
    if (!this.subNombre) return;
    const proceso = this.procesos.find(p => p.id === procesoId);
    if (proceso) {
      proceso.subprocesos.push({
        id: this.generateUUID(),
        nombre: this.subNombre,
        descripcion: this.subDescripcion,
      });
    }
    this.cancelAddSubproceso();
  }

  deleteSubproceso(procesoId: string, subId: string): void {
    const proceso = this.procesos.find(p => p.id === procesoId);
    if (proceso) {
      proceso.subprocesos = proceso.subprocesos.filter(s => s.id !== subId);
    }
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
  }

  startAddSubprocesoModal(): void {
    this.addingSubprocesoModal = true;
    this.subNombre = '';
    this.subDescripcion = '';
  }

  cancelAddSubprocesoModal(): void {
    this.addingSubprocesoModal = false;
    this.subNombre = '';
    this.subDescripcion = '';
  }

  addSubprocesoFromModal(): void {
    if (!this.subNombre || !this.selectedProceso) return;
    this.selectedProceso.subprocesos.push({
      id: this.generateUUID(),
      nombre: this.subNombre,
      descripcion: this.subDescripcion,
    });
    this.cancelAddSubprocesoModal();
  }

  deleteSubprocesoFromModal(subId: string): void {
    if (this.selectedProceso) {
      this.selectedProceso.subprocesos = this.selectedProceso.subprocesos.filter(s => s.id !== subId);
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
