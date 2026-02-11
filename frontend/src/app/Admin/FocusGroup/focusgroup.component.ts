import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';

interface FocusGroup {
  id: string;
  titulo: string;
  moderador: string;
  tipoMedia: string;
  objetivo: string;
  transcripcion: string;
  fecha: string;
  proceso: string;
  subproceso: string;
  participantes: string[];
  conclusiones: string[];
}

@Component({
  selector: 'app-focusgroup',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './focusgroup.component.html',
  styleUrls: ['./focusgroup.component.css']
})
export class FocusGroupComponent implements OnInit {

  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  focusGroups: FocusGroup[] = [];

  showForm = false;

  // Form fields
  titulo = '';
  moderador = '';
  tipoMedia = '';
  objetivo = '';
  transcripcion = '';
  proceso = '';
  subproceso = '';
  participantes: string[] = [''];
  conclusiones: string[] = [''];

  activeTab = 'focus-groups';

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
    private proyectoApiService: ProyectoApiService
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
    }
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  // ===== FORM =====

  handleSubmit(): void {
    if (!this.titulo || !this.moderador || !this.objetivo) return;

    const nuevo: FocusGroup = {
      id: this.generateUUID(),
      titulo: this.titulo,
      moderador: this.moderador,
      tipoMedia: this.tipoMedia,
      objetivo: this.objetivo,
      transcripcion: this.transcripcion,
      fecha: new Date().toISOString().split('T')[0],
      proceso: this.proceso,
      subproceso: this.subproceso,
      participantes: this.participantes.filter(p => p.trim()),
      conclusiones: this.conclusiones.filter(c => c.trim())
    };

    this.focusGroups.push(nuevo);
    this.resetForm();
  }

  resetForm(): void {
    this.titulo = '';
    this.moderador = '';
    this.tipoMedia = '';
    this.objetivo = '';
    this.transcripcion = '';
    this.proceso = '';
    this.subproceso = '';
    this.participantes = [''];
    this.conclusiones = [''];
    this.showForm = false;
  }

  addParticipante(): void {
    this.participantes.push('');
  }

  removeParticipante(index: number): void {
    if (this.participantes.length > 1) {
      this.participantes.splice(index, 1);
    }
  }

  addConclusion(): void {
    this.conclusiones.push('');
  }

  removeConclusion(index: number): void {
    if (this.conclusiones.length > 1) {
      this.conclusiones.splice(index, 1);
    }
  }

  deleteFocusGroup(id: string): void {
    if (confirm('¿Eliminar este focus group?')) {
      const idx = this.focusGroups.findIndex(fg => fg.id === id);
      if (idx !== -1) {
        this.focusGroups.splice(idx, 1);
      }
    }
  }

  formatDate(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
