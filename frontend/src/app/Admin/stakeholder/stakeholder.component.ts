import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoService } from '../../services/proyecto.service';

interface Stakeholder {
  id: string;
  nombre: string;
  rol: string;
  area: string;
  contacto: string;
  notas: string;
  color: string;
}

interface ColorOption {
  valor: string;
  hex: string;
}

@Component({
  selector: 'app-stakeholder',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './stakeholder.component.html',
  styleUrls: ['./stakeholder.component.css']
})
export class StakeholderComponent implements OnInit {

  // Proyecto actual
  proyecto = {
    id: '',
    nombre: '',
    descripcion: '',
    color: 'blue'
  };

  stakeholders: Stakeholder[] = [];

  showForm = false;

  // Form fields
  nombre = '';
  rol = '';
  area = '';
  contacto = '';
  notas = '';
  color = 'blue';

  // Active tab in project sidebar
  activeTab = 'stakeholders';

  readonly COLORES: ColorOption[] = [
    { valor: 'blue', hex: '#3b82f6' },
    { valor: 'emerald', hex: '#10b981' },
    { valor: 'purple', hex: '#8b5cf6' },
    { valor: 'pink', hex: '#ec4899' },
    { valor: 'orange', hex: '#f97316' },
    { valor: 'amber', hex: '#f59e0b' },
  ];

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  constructor(private router: Router, private route: ActivatedRoute, private proyectoService: ProyectoService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      const p = this.proyectoService.getProyectoById(id);
      if (p) {
        this.proyecto.nombre = p.nombre;
        this.proyecto.descripcion = p.descripcion;
        this.proyecto.color = p.color;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  getStakeholderColor(colorValor: string): string {
    const c = this.COLORES.find(x => x.valor === colorValor);
    return c ? c.hex : this.COLORES[0].hex;
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  handleSubmit(): void {
    if (!this.nombre || !this.rol || !this.area || !this.contacto) return;

    const nuevo: Stakeholder = {
      id: this.generateUUID(),
      nombre: this.nombre,
      rol: this.rol,
      area: this.area,
      contacto: this.contacto,
      notas: this.notas,
      color: this.color,
    };

    this.stakeholders.push(nuevo);
    this.resetForm();
  }

  resetForm(): void {
    this.nombre = '';
    this.rol = '';
    this.area = '';
    this.contacto = '';
    this.notas = '';
    this.color = 'blue';
    this.showForm = false;
  }

  deleteStakeholder(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Eliminar este stakeholder?')) {
      this.stakeholders = this.stakeholders.filter(s => s.id !== id);
    }
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
