import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import {
  CreateUmlDiagramDto,
  DiagramaApiService,
  UmlDiagram,
  UmlDiagramType,
} from '../../services/diagrama-api.service';

// Importar los canvas específicos con las rutas correctas
import { CanvasClasesComponent } from './canvas/canvasClases/canvas-clases.component';
import { CanvasCasosUsoComponent } from './canvas/canvasCU/canvas-casos-uso.component';
import { CanvasSecuenciaComponent } from './canvas/canvasSecuencia/canvasSecuencia.component';
import { CanvasPaquetesComponent } from './canvas/canvasPaquetes/canvasPaquetes.component';

type DiagramFilter = UmlDiagramType | 'todos';

interface UmlTypeDefinition {
  id: UmlDiagramType;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-diagramas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BarraComponent,
    CanvasClasesComponent,
    CanvasCasosUsoComponent,
    CanvasSecuenciaComponent,
    CanvasPaquetesComponent
  ],
  templateUrl: './diagramas.component.html',
  styleUrls: ['./diagramas.component.css']
})
export class DiagramasComponent implements OnInit {
  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
  proyectoId: number | null = null;
  activeTab = 'diagramas';
  showCreateForm = false;
  filterTipo: DiagramFilter = 'todos';
  selectedDiagramId: string | null = null;

  // Estado del modal de eliminación
  diagramToDelete: UmlDiagram | null = null;
  isDeleting = false;

  newDiagram = {
    nombre: '',
    descripcion: '',
    tipo: 'clases' as UmlDiagramType,
  };

  diagramas: UmlDiagram[] = [];

  readonly umlTypeDefinitions: UmlTypeDefinition[] = [
    {
      id: 'clases',
      nombre: 'Diagrama de Clases',
      descripcion: 'Define entidades, atributos y relaciones del dominio.'
    },
    {
      id: 'casos-uso',
      nombre: 'Diagrama de Casos de Uso',
      descripcion: 'Representa actores y funcionalidades del sistema.'
    },
    {
      id: 'secuencia',
      nombre: 'Diagrama de Secuencia',
      descripcion: 'Muestra el flujo temporal de mensajes entre participantes.'
    },
    {
      id: 'paquetes',
      nombre: 'Diagrama de Paquetes',
      descripcion: 'Agrupa módulos y dependencias de arquitectura.'
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
    private diagramaApiService: DiagramaApiService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const parsedProyectoId = Number(id);
    if (!Number.isFinite(parsedProyectoId)) {
      return;
    }

    this.proyecto.id = id;
    this.proyectoId = parsedProyectoId;

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

    this.cargarDiagramas();
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const color = this.COLORES_PROYECTO.find((item) => item.valor === this.proyecto.color);
    return color ? color.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  get selectedDiagram(): UmlDiagram | null {
    return this.diagramas.find((item) => item.id === this.selectedDiagramId) ?? null;
  }

  get diagramasFiltrados(): UmlDiagram[] {
    if (this.filterTipo === 'todos') {
      return this.diagramas;
    }

    return this.diagramas.filter((item) => item.tipo === this.filterTipo);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  setFilter(tipo: DiagramFilter): void {
    this.filterTipo = tipo;
  }

  countByType(tipo: UmlDiagramType): number {
    return this.diagramas.filter((item) => item.tipo === tipo).length;
  }

  getTypeName(tipo: UmlDiagramType): string {
    return this.umlTypeDefinitions.find((item) => item.id === tipo)?.nombre ?? tipo;
  }

  createDiagram(): void {
    if (!this.proyectoId) {
      return;
    }

    const nombre = this.newDiagram.nombre.trim();
    if (!nombre) {
      return;
    }

    const dto: CreateUmlDiagramDto = {
      id_proyecto: this.proyectoId,
      nombre,
      descripcion: this.newDiagram.descripcion,
      tipo: this.newDiagram.tipo,
      nodes: [],
    };

    this.diagramaApiService.create(dto).subscribe({
      next: (created) => {
        this.diagramas = [created, ...this.diagramas];
        this.filterTipo = 'todos';
        this.showCreateForm = false;
        this.resetCreateForm();
        this.selectDiagram(created.id);
      },
      error: (error: unknown) => console.error('Error al crear diagrama:', error),
    });
  }

  selectDiagram(diagramId: string): void {
    const diagram = this.diagramas.find((item) => item.id === diagramId);
    if (!diagram) {
      return;
    }

    this.selectedDiagramId = diagram.id;
  }

  // ─── Eliminación ───────────────────────────────────────────────────────────

  /** Abre el modal de confirmación con el diagrama a eliminar */
  confirmDelete(diagram: UmlDiagram): void {
    this.diagramToDelete = diagram;
  }

  /** Cierra el modal sin eliminar */
  cancelDelete(): void {
    if (this.isDeleting) {
      return; // no cerrar mientras la petición está en curso
    }
    this.diagramToDelete = null;
  }

  /** Ejecuta la eliminación contra el backend */
  deleteDiagram(): void {
    if (!this.diagramToDelete || this.isDeleting) {
      return;
    }

    const id = this.diagramToDelete.id;
    this.isDeleting = true;

    this.diagramaApiService.delete(id).subscribe({
      next: () => {
        // Si el diagrama eliminado era el seleccionado, deseleccionar
        if (this.selectedDiagramId === id) {
          this.selectedDiagramId = null;
        }

        // Quitar de la lista local
        this.diagramas = this.diagramas.filter((d) => d.id !== id);

        this.isDeleting = false;
        this.diagramToDelete = null;
      },
      error: (error: unknown) => {
        console.error('Error al eliminar diagrama:', error);
        this.isDeleting = false;
      },
    });
  }

  // ─── Callbacks canvas ──────────────────────────────────────────────────────

  onDiagramUpdated(updatedDiagram: UmlDiagram): void {
    this.diagramas = this.diagramas.map((diagram) => {
      if (diagram.id !== updatedDiagram.id) {
        return diagram;
      }
      return updatedDiagram;
    });
  }

  trackByType(_index: number, type: UmlTypeDefinition): string {
    return type.id;
  }

  trackByDiagram(_index: number, diagram: UmlDiagram): string {
    return diagram.id;
  }

  private cargarDiagramas(): void {
    if (!this.proyectoId) {
      return;
    }

    this.diagramaApiService.getByProyecto(this.proyectoId).subscribe({
      next: (items) => {
        this.diagramas = items;

        if (items.length > 0 && !this.selectedDiagramId) {
          this.selectDiagram(items[0].id);
        }
      },
      error: (error: unknown) => console.error('Error al cargar diagramas:', error),
    });
  }

  private resetCreateForm(): void {
    this.newDiagram = {
      nombre: '',
      descripcion: '',
      tipo: 'clases',
    };
  }
}