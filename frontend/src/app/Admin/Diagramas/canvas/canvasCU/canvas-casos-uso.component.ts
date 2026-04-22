import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

interface PaletteItem {
    kind: string;
    label: string;
    hint: string;
}

@Component({
    selector: 'app-canvas-casos-uso',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvas-casos-uso.component.html',
    styleUrls: ['./canvas-casos-uso.component.css']
})
export class CanvasCasosUsoComponent implements OnInit, OnDestroy {
    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: CanvasNode[] = [];
    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private hasPendingNodeMove = false;

    readonly palette: PaletteItem[] = [
        { kind: 'actor', label: 'Actor', hint: 'Rol que interactúa con el sistema' },
        { kind: 'caso', label: 'Caso de uso', hint: 'Función concreta del sistema' },
        { kind: 'sistema', label: 'Sistema', hint: 'Límite del sistema modelado' },
        { kind: 'include', label: 'Include / Extend', hint: 'Relación entre casos de uso' },
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

    guardarLienzo(): void {
        this.persistCanvasNodes();
    }

    clearCanvas(): void {
        if (this.canvasNodes.length === 0) {
            return;
        }
        this.canvasNodes = [];
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
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    onCanvasDrop(event: DragEvent): void {
        event.preventDefault();

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

    trackByNode(_index: number, node: CanvasNode): string {
        return node.id;
    }

    trackByPalette(_index: number, item: PaletteItem): string {
        return item.kind;
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
            return { ...node, x, y };
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

    private buildStarterNodes(): CanvasNode[] {
        return [
            { id: this.buildNodeId(), kind: 'actor', label: 'Actor 1', x: 56, y: 72 },
            { id: this.buildNodeId(), kind: 'caso', label: 'Caso de uso 1', x: 258, y: 80 },
            { id: this.buildNodeId(), kind: 'sistema', label: 'Sistema 1', x: 244, y: 220 },
        ];
    }

    private buildNodeLabel(kind: string, baseLabel: string): string {
        const count = this.canvasNodes.filter((node) => node.kind === kind).length + 1;
        return `${baseLabel} ${count}`;
    }

    private persistCanvasNodes(): void {
        if (!this.diagram) {
            return;
        }

        const nodes = this.canvasNodes.map((node) => ({ ...node }));

        this.diagramaApiService.update(this.diagram.id, { nodes }).subscribe({
            next: (updated) => {
                this.diagramUpdated.emit(updated);
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