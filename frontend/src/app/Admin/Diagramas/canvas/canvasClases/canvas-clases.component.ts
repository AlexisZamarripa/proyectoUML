import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

export interface PaletteGroup {
    groupId: string;
    groupLabel: string;
    icon: string;
    items: PaletteItem[];
}

export interface PaletteItem {
    kind: string;
    label: string;
    hint: string;
    icon: string;
    badge?: string;
}

@Component({
    selector: 'app-canvas-clases',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvas-clases.component.html',
    styleUrls: ['./canvas-clases.component.css']
})
export class CanvasClasesComponent implements OnInit, OnDestroy {
    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: CanvasNode[] = [];
    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private hasPendingNodeMove = false;

    /** IDs de grupos colapsados */
    collapsedGroups = new Set<string>();

    readonly paletteGroups: PaletteGroup[] = [
        {
            groupId: 'figuras',
            groupLabel: 'Figuras',
            icon: '⬜',
            items: [
                { kind: 'clase', label: 'Clase', hint: 'Entidad principal del dominio', icon: '🟦', badge: 'C' },
                { kind: 'clase-abstracta', label: 'Clase abstracta', hint: 'Clase que no puede instanciarse', icon: '🟧', badge: 'A' },
                { kind: 'interfaz', label: 'Interfaz', hint: 'Contrato de comportamiento', icon: '🟩', badge: '«I»' },
                { kind: 'enumeracion', label: 'Enumeración', hint: 'Conjunto de valores constantes', icon: '🟪', badge: '«E»' },
            ]
        },
        {
            groupId: 'componentes',
            groupLabel: 'Componentes de clase',
            icon: '🔧',
            items: [
                { kind: 'nombre-clase', label: 'Nombre de clase', hint: 'Etiqueta identificadora de la clase', icon: '🏷️' },
                { kind: 'atributo', label: 'Atributo', hint: 'Campo con tipo de dato', icon: '📌' },
                { kind: 'metodo', label: 'Método', hint: 'Operación con parámetros y retorno', icon: '⚙️' },
                { kind: 'visibilidad', label: 'Visibilidad', hint: '+ público  − privado  # protegido  ~ paquete', icon: '🔐' },
            ]
        },
        {
            groupId: 'relaciones',
            groupLabel: 'Relaciones',
            icon: '🔗',
            items: [
                { kind: 'asociacion', label: 'Asociación', hint: 'Relación estructural entre clases', icon: '➡️' },
                { kind: 'herencia', label: 'Herencia', hint: 'Generalización / extensión', icon: '▷' },
                { kind: 'agregacion', label: 'Agregación', hint: 'Parte independiente del todo', icon: '◇' },
                { kind: 'composicion', label: 'Composición', hint: 'Parte dependiente del todo', icon: '◆' },
                { kind: 'dependencia', label: 'Dependencia', hint: 'Uso temporal entre clases', icon: '⇢' },
                { kind: 'realizacion', label: 'Realización', hint: 'Implementación de interfaz', icon: '⇠' },
            ]
        },
        {
            groupId: 'extras',
            groupLabel: 'Extras',
            icon: '✨',
            items: [
                { kind: 'multiplicidad', label: 'Multiplicidad', hint: '1  *  0..1  1..*  0..*', icon: '🔢' },
                { kind: 'navegabilidad', label: 'Navegabilidad', hint: 'Dirección de las flechas', icon: '🧭' },
                { kind: 'nota', label: 'Nota / Comentario', hint: 'Anotación libre sobre el diagrama', icon: '📝' },
            ]
        },
    ];

    constructor(private diagramaApiService: DiagramaApiService) { }

    ngOnInit(): void {
        if (this.diagram) {
            this.canvasNodes = this.diagram.nodes.map((node) => ({ ...node }));
            if (this.canvasNodes.length === 0) {
                this.canvasNodes = this.buildStarterNodes();
                this.persistCanvasNodes();
            }
        }
    }

    ngOnDestroy(): void {
        this.removeDragListeners();
    }

    toggleGroup(groupId: string): void {
        if (this.collapsedGroups.has(groupId)) {
            this.collapsedGroups.delete(groupId);
        } else {
            this.collapsedGroups.add(groupId);
        }
    }

    isGroupCollapsed(groupId: string): boolean {
        return this.collapsedGroups.has(groupId);
    }

    guardarLienzo(): void {
        this.persistCanvasNodes();
    }

    clearCanvas(): void {
        if (this.canvasNodes.length === 0) return;
        this.canvasNodes = [];
        this.persistCanvasNodes();
    }

    onPaletteDragStart(event: DragEvent, item: PaletteItem): void {
        if (!event.dataTransfer) return;
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/x-uml-kind', item.kind);
        event.dataTransfer.setData('application/x-uml-label', item.label);
        event.dataTransfer.setData('application/x-uml-icon', item.icon);
        event.dataTransfer.setData('application/x-uml-badge', item.badge ?? '');
    }

    onCanvasDragOver(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onCanvasDrop(event: DragEvent): void {
        event.preventDefault();

        const kind = event.dataTransfer?.getData('application/x-uml-kind');
        const label = event.dataTransfer?.getData('application/x-uml-label');
        const icon = event.dataTransfer?.getData('application/x-uml-icon');
        const badge = event.dataTransfer?.getData('application/x-uml-badge');

        if (!kind || !label) return;

        const stage = event.currentTarget;
        if (!(stage instanceof HTMLElement)) return;

        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - 72, 12, rect.width - 148);
        const y = this.clamp(event.clientY - rect.top - 24, 12, rect.height - 60);

        const newNode: CanvasNode = {
            id: this.buildNodeId(),
            kind,
            label: this.buildNodeLabel(kind, label),
            x,
            y,
            icon: icon ?? '',
            badge: badge ?? '',
        } as any;

        this.canvasNodes = [...this.canvasNodes, newNode];
        this.persistCanvasNodes();
    }

    startNodeDrag(event: PointerEvent, nodeId: string): void {
        if (event.button !== 0) return;

        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find((item) => item.id === nodeId);
        if (!stage || !node) return;

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

    trackByNode(_index: number, node: CanvasNode): string { return node.id; }
    trackByGroup(_index: number, g: PaletteGroup): string { return g.groupId; }
    trackByItem(_index: number, item: PaletteItem): string { return item.kind; }

    /** Icono emoji para mostrar en el nodo según su kind */
    nodeIcon(kind: string): string {
        for (const group of this.paletteGroups) {
            const found = group.items.find(i => i.kind === kind);
            if (found) return found.icon;
        }
        return '📦';
    }

    /** Badge textual (C, A, «I», «E»…) para mostrar en el nodo */
    nodeBadge(kind: string): string {
        for (const group of this.paletteGroups) {
            const found = group.items.find(i => i.kind === kind);
            if (found?.badge) return found.badge;
        }
        return '';
    }

    // ─────────────────────────────────────────────────────────
    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) return;

        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;

        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 148);
        const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 60);

        this.canvasNodes = this.canvasNodes.map((node) =>
            node.id !== this.draggingNodeId ? node : { ...node, x, y }
        );
        this.hasPendingNodeMove = true;
    };

    private readonly onWindowPointerUp = (): void => {
        if (!this.draggingNodeId) { this.removeDragListeners(); return; }
        this.draggingNodeId = null;
        this.removeDragListeners();
        if (this.hasPendingNodeMove) {
            this.persistCanvasNodes();
            this.hasPendingNodeMove = false;
        }
    };

    private buildStarterNodes(): CanvasNode[] {
        return [
            { id: this.buildNodeId(), kind: 'clase', label: 'MiClase', x: 56, y: 68, icon: '🟦' } as any,
            { id: this.buildNodeId(), kind: 'interfaz', label: 'IServicio', x: 290, y: 74, icon: '🟩' } as any,
            { id: this.buildNodeId(), kind: 'herencia', label: 'Herencia', x: 170, y: 220, icon: '▷' } as any,
        ];
    }

    private buildNodeLabel(kind: string, baseLabel: string): string {
        const count = this.canvasNodes.filter((node) => node.kind === kind).length + 1;
        return `${baseLabel} ${count}`;
    }

    private persistCanvasNodes(): void {
        if (!this.diagram) return;
        const nodes = this.canvasNodes.map((node) => ({ ...node }));
        this.diagramaApiService.update(this.diagram.id, { nodes }).subscribe({
            next: (updated) => this.diagramUpdated.emit(updated),
            error: (error: unknown) => console.error('Error al guardar canvas:', error),
        });
    }

    private clamp(value: number, min: number, max: number): number {
        if (max <= min) return min;
        return Math.min(Math.max(value, min), max);
    }

    private buildNodeId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
        return `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private removeDragListeners(): void {
        if (typeof window === 'undefined') return;
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }
}