import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

export interface PaletteItem {
    kind: string;
    label: string;
    iconType: 'svg' | 'badge' | 'text';
    icon?: string;
}

export interface PaletteGroup {
    id: string;           // clave para persistir en localStorage
    title: string;
    collapsed: boolean;
    items: PaletteItem[];
}

const STORAGE_KEY = 'canvas-paquetes-palette-collapsed';

@Component({
    selector: 'app-canvas-paquetes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvasPaquetes.component.html',
    styleUrls: ['./canvasPaquetes.component.css']
})
export class CanvasPaquetesComponent implements OnInit, OnDestroy {
    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: CanvasNode[] = [];
    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private hasPendingNodeMove = false;

    readonly paletteGroups: PaletteGroup[] = [
        {
            id: 'elementos', title: 'Elementos', collapsed: false,
            items: [
                { kind: 'paquete', label: 'Paquete', iconType: 'svg' },
                { kind: 'subpaquete', label: 'Subpaquete', iconType: 'svg' },
                { kind: 'nota', label: 'Nota / Comentario', iconType: 'svg' },
            ],
        },
        {
            id: 'relaciones', title: 'Relaciones', collapsed: false,
            items: [
                { kind: 'dependencia', label: 'Dependencia', iconType: 'svg' },
                { kind: 'importacion', label: 'Importación', iconType: 'svg' },
                { kind: 'acceso', label: 'Acceso', iconType: 'svg' },
            ],
        },
        {
            id: 'extras', title: 'Extras', collapsed: false,
            items: [
                { kind: 'agrupacion', label: 'Agrupación', iconType: 'svg' },
                { kind: 'nota-extra', label: 'Nota / Comentario', iconType: 'svg' },
            ],
        },
    ];

    constructor(private diagramaApiService: DiagramaApiService) { }

    ngOnInit(): void {
        this.restoreCollapsedState();

        if (this.diagram) {
            this.canvasNodes = this.diagram.nodes.map((n) => ({ ...n }));
            if (this.canvasNodes.length === 0) {
                this.canvasNodes = this.buildStarterNodes();
                this.persistCanvasNodes();
            }
        }
    }

    ngOnDestroy(): void { this.removeDragListeners(); }

    // ── Acordeón ──────────────────────────────────────────────────────────────
    toggleGroup(group: PaletteGroup): void {
        group.collapsed = !group.collapsed;
        this.saveCollapsedState();
    }

    private saveCollapsedState(): void {
        try {
            const state: Record<string, boolean> = {};
            this.paletteGroups.forEach((g) => (state[g.id] = g.collapsed));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { /* localStorage bloqueado */ }
    }

    private restoreCollapsedState(): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const state: Record<string, boolean> = JSON.parse(raw);
            this.paletteGroups.forEach((g) => {
                if (g.id in state) g.collapsed = state[g.id];
            });
        } catch { /* dato corrupto, ignorar */ }
    }

    // ── Canvas ────────────────────────────────────────────────────────────────
    guardarLienzo(): void { this.persistCanvasNodes(); }

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
    }

    onCanvasDragOver(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onCanvasDrop(event: DragEvent): void {
        event.preventDefault();
        const kind = event.dataTransfer?.getData('application/x-uml-kind');
        const label = event.dataTransfer?.getData('application/x-uml-label');
        if (!kind || !label) return;

        const stage = event.currentTarget;
        if (!(stage instanceof HTMLElement)) return;

        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - 72, 12, rect.width - 148);
        const y = this.clamp(event.clientY - rect.top - 24, 12, rect.height - 60);

        this.canvasNodes = [...this.canvasNodes, {
            id: this.buildNodeId(), kind,
            label: this.buildNodeLabel(kind, label), x, y,
        }];
        this.persistCanvasNodes();
    }

    startNodeDrag(event: PointerEvent, nodeId: string): void {
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find((n) => n.id === nodeId);
        if (!stage || !node) return;

        const rect = stage.getBoundingClientRect();
        this.draggingNodeId = nodeId;
        this.dragOffsetX = event.clientX - rect.left - node.x;
        this.dragOffsetY = event.clientY - rect.top - node.y;
        this.hasPendingNodeMove = false;

        window.addEventListener('pointermove', this.onWindowPointerMove);
        window.addEventListener('pointerup', this.onWindowPointerUp);
        event.preventDefault();
    }

    removeNode(nodeId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.canvasNodes = this.canvasNodes.filter((n) => n.id !== nodeId);
        this.persistCanvasNodes();
    }

    trackByNode(_i: number, n: CanvasNode): string { return n.id; }
    trackByGroup(_i: number, g: PaletteGroup): string { return g.id; }
    trackByItem(_i: number, p: PaletteItem): string { return p.kind; }

    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 148);
        const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 60);
        this.canvasNodes = this.canvasNodes.map((n) =>
            n.id !== this.draggingNodeId ? n : { ...n, x, y }
        );
        this.hasPendingNodeMove = true;
    };

    private readonly onWindowPointerUp = (): void => {
        if (!this.draggingNodeId) { this.removeDragListeners(); return; }
        this.draggingNodeId = null;
        this.removeDragListeners();
        if (this.hasPendingNodeMove) { this.persistCanvasNodes(); this.hasPendingNodeMove = false; }
    };

    private buildStarterNodes(): CanvasNode[] {
        return [
            { id: this.buildNodeId(), kind: 'paquete', label: 'Paquete 1', x: 56, y: 72 },
            { id: this.buildNodeId(), kind: 'subpaquete', label: 'Subpaquete 1', x: 260, y: 80 },
            { id: this.buildNodeId(), kind: 'dependencia', label: 'Dependencia 1', x: 172, y: 216 },
        ];
    }

    private buildNodeLabel(kind: string, base: string): string {
        const count = this.canvasNodes.filter((n) => n.kind === kind).length + 1;
        return `${base} ${count}`;
    }

    private persistCanvasNodes(): void {
        if (!this.diagram) return;
        this.diagramaApiService.update(this.diagram.id, { nodes: this.canvasNodes.map((n) => ({ ...n })) }).subscribe({
            next: (updated) => this.diagramUpdated.emit(updated),
            error: (err: unknown) => console.error('Error al guardar canvas:', err),
        });
    }

    private clamp(v: number, min: number, max: number): number {
        return max <= min ? min : Math.min(Math.max(v, min), max);
    }

    private buildNodeId(): string {
        return typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private removeDragListeners(): void {
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }
}