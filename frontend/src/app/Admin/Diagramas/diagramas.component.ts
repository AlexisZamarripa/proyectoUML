import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';

interface DiagramTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'flujo' | 'uml' | 'interacciones';
}

@Component({
  selector: 'app-diagramas',
  standalone: true,
  imports: [CommonModule, BarraComponent],
  templateUrl: './diagramas.component.html',
  styleUrls: ['./diagramas.component.css']
})
export class DiagramasComponent implements OnInit {
  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
  activeTab = 'diagramas';
  selectedTemplateId = 'flujo-usuario';

  readonly diagramTemplates: DiagramTemplate[] = [
    {
      id: 'flujo-usuario',
      nombre: 'Flujo de Usuario',
      descripcion: 'Secuencia los pasos principales de navegacion y toma de decisiones.',
      tipo: 'flujo'
    },
    {
      id: 'casos-uso-uml',
      nombre: 'Casos de Uso UML',
      descripcion: 'Relaciona actores con funcionalidades clave del sistema.',
      tipo: 'uml'
    },
    {
      id: 'mapa-interacciones',
      nombre: 'Mapa de Interacciones',
      descripcion: 'Conecta stakeholders, canales y puntos de contacto criticos.',
      tipo: 'interacciones'
    }
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
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.proyecto.id = id;
    this.proyectoApiService.getProyecto(id).subscribe({
      next: (p) => {
        this.proyecto = {
          id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          color: p.color,
        };
      },
      error: (error: unknown) => console.error('Error al cargar proyecto:', error)
    });
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const color = this.COLORES_PROYECTO.find((item) => item.valor === this.proyecto.color);
    return color ? color.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  selectTemplate(templateId: string): void {
    this.selectedTemplateId = templateId;
  }

  isSelected(templateId: string): boolean {
    return this.selectedTemplateId === templateId;
  }

  get selectedTemplateName(): string {
    return this.diagramTemplates.find((template) => template.id === this.selectedTemplateId)?.nombre ?? 'Diagrama';
  }

  trackByTemplate(_index: number, template: DiagramTemplate): string {
    return template.id;
  }
}
