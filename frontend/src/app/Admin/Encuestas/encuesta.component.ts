import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoService } from '../../services/proyecto.service';

interface Pregunta {
  id: string;
  texto: string;
  tipo: string;
}

interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string;
  participantesEsperados: number;
  proceso: string;
  subproceso: string;
  preguntas: Pregunta[];
  estado: 'borrador' | 'activa' | 'cerrada';
  fecha: string;
  participantesReales: number;
}

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit {

  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  activeTab = 'encuestas';

  encuestas: Encuesta[] = [];
  showForm = false;

  // Form fields
  titulo = '';
  descripcion = '';
  participantesEsperados = 0;
  proceso = '';
  subproceso = '';
  preguntas: Pregunta[] = [{ id: this.uid(), texto: '', tipo: 'texto' }];

  TIPOS_PREGUNTA = [
    { valor: 'texto', label: 'Texto abierto' },
    { valor: 'opcion-multiple', label: 'Opción múltiple' },
    { valor: 'escala', label: 'Escala (1-5)' },
    { valor: 'si-no', label: 'Sí / No' },
    { valor: 'seleccion', label: 'Selección única' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoService: ProyectoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const p = this.proyectoService.getProyectoById(id);
      if (p) {
        this.proyecto = {
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          color: p.color
        };
      }
    }
  }

  // Stats
  get totalEncuestas(): number {
    return this.encuestas.length;
  }

  get borradores(): number {
    return this.encuestas.filter(e => e.estado === 'borrador').length;
  }

  get activas(): number {
    return this.encuestas.filter(e => e.estado === 'activa').length;
  }

  get cerradas(): number {
    return this.encuestas.filter(e => e.estado === 'cerrada').length;
  }

  get encuestasBorrador(): Encuesta[] {
    return this.encuestas.filter(e => e.estado === 'borrador');
  }

  get encuestasActivas(): Encuesta[] {
    return this.encuestas.filter(e => e.estado === 'activa');
  }

  get encuestasCerradas(): Encuesta[] {
    return this.encuestas.filter(e => e.estado === 'cerrada');
  }

  // Form
  handleSubmit(): void {
    if (!this.titulo.trim() || !this.descripcion.trim()) return;

    const nueva: Encuesta = {
      id: this.uid(),
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      participantesEsperados: this.participantesEsperados,
      proceso: this.proceso.trim(),
      subproceso: this.subproceso.trim(),
      preguntas: this.preguntas.filter(p => p.texto.trim() !== ''),
      estado: 'borrador',
      fecha: new Date().toISOString().split('T')[0],
      participantesReales: 0
    };

    this.encuestas.push(nueva);
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.participantesEsperados = 0;
    this.proceso = '';
    this.subproceso = '';
    this.preguntas = [{ id: this.uid(), texto: '', tipo: 'texto' }];
  }

  addPregunta(): void {
    this.preguntas.push({ id: this.uid(), texto: '', tipo: 'texto' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) {
      this.preguntas.splice(index, 1);
    }
  }

  deleteEncuesta(id: string): void {
    this.encuestas = this.encuestas.filter(e => e.id !== id);
  }

  activarEncuesta(id: string): void {
    const enc = this.encuestas.find(e => e.id === id);
    if (enc) enc.estado = 'activa';
  }

  cerrarEncuesta(id: string): void {
    const enc = this.encuestas.find(e => e.id === id);
    if (enc) enc.estado = 'cerrada';
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const gradients: Record<string, string> = {
      blue: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      purple: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      green: 'linear-gradient(135deg, #10b981, #059669)',
      orange: 'linear-gradient(135deg, #f97316, #ef4444)',
      cyan: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      pink: 'linear-gradient(135deg, #ec4899, #8b5cf6)'
    };
    return gradients[this.proyecto.color] || gradients['blue'];
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'borrador': return 'badge-gray';
      case 'activa': return 'badge-green';
      case 'cerrada': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'activa': return 'Activa';
      case 'cerrada': return 'Cerrada';
      default: return estado;
    }
  }

  private uid(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
