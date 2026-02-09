import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoService } from '../../services/proyecto.service';

interface Observacion {
  id: string;
  titulo: string;
  observaciones: string;
  hallazgos: string[];
  proceso: string;
  subproceso: string;
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

  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  activeTab = 'observaciones';

  observaciones: Observacion[] = [];
  showForm = false;

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
  proceso = '';
  subproceso = '';

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

  handleSubmit(): void {
    if (!this.titulo.trim() || !this.textoObservaciones.trim()) return;

    const nueva: Observacion = {
      id: this.uid(),
      titulo: this.titulo.trim(),
      observaciones: this.textoObservaciones.trim(),
      hallazgos: this.hallazgos.filter(h => h.trim() !== ''),
      proceso: this.proceso.trim(),
      subproceso: this.subproceso.trim(),
      fecha: new Date().toISOString().split('T')[0]
    };

    this.observaciones.push(nueva);
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.titulo = '';
    this.textoObservaciones = '';
    this.hallazgos = [];
    this.tempHallazgo = '';
    this.proceso = '';
    this.subproceso = '';
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

  deleteObservacion(id: string): void {
    this.observaciones = this.observaciones.filter(o => o.id !== id);
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  private uid(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
