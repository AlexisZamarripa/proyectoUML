import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import {
  CanvasNode,
  CreateUmlDiagramDto,
  DiagramaApiService,
  UmlDiagram,
  UmlDiagramType,
} from '../../services/diagrama-api.service';

type DiagramFilter = UmlDiagramType | 'todos';

interface UmlTypeDefinition {
  id: UmlDiagramType;
  nombre: string;
  descripcion: string;
}

interface PaletteItem {
  kind: string;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-diagramas',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './diagramas.component.html',
  styleUrls: ['./diagramas.component.css']
})
export class DiagramasComponent implements OnInit, OnDestroy {
  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
  proyectoId: number | null = null;
  activeTab = 'diagramas';
  showCreateForm = false;
  filterTipo: DiagramFilter = 'todos';
  selectedDiagramId: string | null = null;

  newDiagram = {
    nombre: '',
    descripcion: '',
    tipo: 'clases' as UmlDiagramType,
  };

  diagramas: UmlDiagram[] = [];
  canvasNodes: CanvasNode[] = [];
  @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

  draggingNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private hasPendingNodeMove = false;

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
      descripcion: 'Agrupa modulos y dependencias de arquitectura.'
    }
  ];

  readonly paletteByType: Record<UmlDiagramType, PaletteItem[]> = {
    'clases': [
      { kind: 'clase', label: 'Clase', hint: 'Entidad principal del dominio' },
      { kind: 'interfaz', label: 'Interfaz', hint: 'Contrato de comportamiento' },
      { kind: 'enumeracion', label: 'Enumeracion', hint: 'Conjunto de valores fijos' },
      { kind: 'relacion', label: 'Relacion', hint: 'Asociacion entre clases' },
    ],
    'casos-uso': [
      { kind: 'actor', label: 'Actor', hint: 'Rol que interactua con el sistema' },
      { kind: 'caso', label: 'Caso de uso', hint: 'Funcion concreta del sistema' },
      { kind: 'sistema', label: 'Sistema', hint: 'Limite del sistema modelado' },
      { kind: 'include', label: 'Include / Extend', hint: 'Relacion entre casos de uso' },
    ],
    'secuencia': [
      { kind: 'participante', label: 'Participante', hint: 'Objeto o servicio involucrado' },
      { kind: 'mensaje', label: 'Mensaje', hint: 'Invocacion o respuesta' },
      { kind: 'activacion', label: 'Activacion', hint: 'Bloque de ejecucion' },
      { kind: 'decision', label: 'Decision', hint: 'Rama condicional del flujo' },
    ],
    'paquetes': [
      { kind: 'paquete', label: 'Paquete', hint: 'Modulo logico del sistema' },
      { kind: 'subpaquete', label: 'Subpaquete', hint: 'Subdivision de un paquete mayor' },
      { kind: 'componente', label: 'Componente', hint: 'Unidad desplegable o libreria' },
      { kind: 'dependencia', label: 'Dependencia', hint: 'Relacion entre paquetes' },
    ],
  };

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

  ngOnDestroy(): void {
    this.removeDragListeners();
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

  get activePalette(): PaletteItem[] {
    const activeType = this.selectedDiagram?.tipo ?? this.newDiagram.tipo;
    return this.paletteByType[activeType];
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

  getTypeDescription(tipo: UmlDiagramType): string {
    return this.umlTypeDefinitions.find((item) => item.id === tipo)?.descripcion ?? '';
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
      nodes: this.buildStarterNodes(this.newDiagram.tipo),
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
    this.canvasNodes = diagram.nodes.map((node) => ({ ...node }));
  }

  clearCanvas(): void {
    if (this.canvasNodes.length === 0) {
      return;
    }

    this.canvasNodes = [];
    this.persistCanvasNodes();
  }

  guardarLienzo(): void {
    this.persistCanvasNodes();
  }

  onPaletteDragStart(event: DragEvent, paletteItem: PaletteItem): void {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-uml-kind', paletteItem.kind);
    event.dataTransfer.setData('application/x-uml-label', paletteItem.label);
  }

  onCanvasDragOver(event: DragEvent): void {
    if (!this.selectedDiagram) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.selectedDiagram) {
      return;
    }

    const kind = event.dataTransfer?.getData('application/x-uml-kind');
    const label = event.dataTransfer?.getData('application/x-uml-label');

    if (!kind || !label) {
      return;
    }

    const stage = event.currentTarget;
    if (!(stage instanceof HTMLElement)) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const x = this.clamp(event.clientX - rect.left - 72, 12, rect.width - 148);
    const y = this.clamp(event.clientY - rect.top - 24, 12, rect.height - 60);

    const newNode: CanvasNode = {
      id: this.buildNodeId(),
      kind,
      label: this.buildNodeLabel(kind, label),
      x,
      y,
    };

    this.canvasNodes = [...this.canvasNodes, newNode];
    this.persistCanvasNodes();
  }

  startNodeDrag(event: PointerEvent, nodeId: string): void {
    if (event.button !== 0) {
      return;
    }

    const stage = this.canvasStageRef?.nativeElement;
    const node = this.canvasNodes.find((item) => item.id === nodeId);

    if (!stage || !node) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    this.draggingNodeId = nodeId;
    this.dragOffsetX = event.clientX - rect.left - node.x;
    this.dragOffsetY = event.clientY - rect.top - node.y;
    this.hasPendingNodeMove = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.onWindowPointerMove);
      window.addEventListener('pointerup', this.onWindowPointerUp);
    }

    event.preventDefault();
  }

  removeNode(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.canvasNodes = this.canvasNodes.filter((item) => item.id !== nodeId);
    this.persistCanvasNodes();
  }

  trackByType(_index: number, type: UmlTypeDefinition): string {
    return type.id;
  }

  trackByDiagram(_index: number, diagram: UmlDiagram): string {
    return diagram.id;
  }

  trackByPalette(_index: number, item: PaletteItem): string {
    return item.kind;
  }

  trackByNode(_index: number, node: CanvasNode): string {
    return node.id;
  }

  private readonly onWindowPointerMove = (event: PointerEvent): void => {
    if (!this.draggingNodeId) {
      return;
    }

    const stage = this.canvasStageRef?.nativeElement;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 148);
    const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 60);

    this.canvasNodes = this.canvasNodes.map((node) => {
      if (node.id !== this.draggingNodeId) {
        return node;
      }

      return {
        ...node,
        x,
        y,
      };
    });

    this.hasPendingNodeMove = true;
  };

  private readonly onWindowPointerUp = (): void => {
    if (!this.draggingNodeId) {
      this.removeDragListeners();
      return;
    }

    this.draggingNodeId = null;
    this.removeDragListeners();

    if (this.hasPendingNodeMove) {
      this.persistCanvasNodes();
      this.hasPendingNodeMove = false;
    }
  };

  private cargarDiagramas(): void {
    if (!this.proyectoId) {
      return;
    }

    this.diagramaApiService.getByProyecto(this.proyectoId).subscribe({
      next: (items) => {
        this.diagramas = items;

        if (items.length === 0) {
          this.selectedDiagramId = null;
          this.canvasNodes = [];
          return;
        }

        if (!this.selectedDiagramId || !items.some((item) => item.id === this.selectedDiagramId)) {
          this.selectDiagram(items[0].id);
          return;
        }

        const selected = items.find((item) => item.id === this.selectedDiagramId);
        this.canvasNodes = selected ? selected.nodes.map((node) => ({ ...node })) : [];
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

  private buildStarterNodes(tipo: UmlDiagramType): CanvasNode[] {
    if (tipo === 'clases') {
      return [
        { id: this.buildNodeId(), kind: 'clase', label: 'Clase 1', x: 56, y: 68 },
        { id: this.buildNodeId(), kind: 'interfaz', label: 'Interfaz 1', x: 270, y: 74 },
        { id: this.buildNodeId(), kind: 'relacion', label: 'Relacion 1', x: 162, y: 212 },
      ];
    }

    if (tipo === 'casos-uso') {
      return [
        { id: this.buildNodeId(), kind: 'actor', label: 'Actor 1', x: 56, y: 72 },
        { id: this.buildNodeId(), kind: 'caso', label: 'Caso de uso 1', x: 258, y: 80 },
        { id: this.buildNodeId(), kind: 'sistema', label: 'Sistema 1', x: 244, y: 220 },
      ];
    }

    if (tipo === 'secuencia') {
      return [
        { id: this.buildNodeId(), kind: 'participante', label: 'Participante 1', x: 54, y: 66 },
        { id: this.buildNodeId(), kind: 'participante', label: 'Participante 2', x: 280, y: 66 },
        { id: this.buildNodeId(), kind: 'mensaje', label: 'Mensaje 1', x: 168, y: 200 },
      ];
    }

    return [
      { id: this.buildNodeId(), kind: 'paquete', label: 'Paquete 1', x: 56, y: 72 },
      { id: this.buildNodeId(), kind: 'subpaquete', label: 'Subpaquete 1', x: 260, y: 80 },
      { id: this.buildNodeId(), kind: 'dependencia', label: 'Dependencia 1', x: 172, y: 216 },
    ];
  }

  private buildNodeLabel(kind: string, baseLabel: string): string {
    const count = this.canvasNodes.filter((node) => node.kind === kind).length + 1;
    return `${baseLabel} ${count}`;
  }

  private persistCanvasNodes(): void {
    if (!this.selectedDiagramId) {
      return;
    }

    const nodes = this.canvasNodes.map((node) => ({ ...node }));

    this.diagramaApiService.update(this.selectedDiagramId, { nodes }).subscribe({
      next: (updated) => {
        this.diagramas = this.diagramas.map((diagram) => {
          if (diagram.id !== updated.id) {
            return diagram;
          }

          return updated;
        });
      },
      error: (error: unknown) => console.error('Error al guardar canvas:', error),
    });
  }

  private clamp(value: number, min: number, max: number): number {
    if (max <= min) {
      return min;
    }

    return Math.min(Math.max(value, min), max);
  }

  private buildNodeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  private removeDragListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
  }
}
