import {
    AfterViewChecked, Component, ElementRef, EventEmitter,
    Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../../../components/confirm-modal/confirm-modal.component';

/* ── Interfaces ── */
export interface PkgCanvasNode extends CanvasNode {
    noteText?: string;
}

export interface PkgRelation {
    id: string;
    kind: string;       /* dependencia | importacion | acceso */
    sourceId: string;
    targetId: string;
    label?: string;
}

export interface PendingRelation { kind: string; sourceId?: string; }
export interface GhostLine { x1: number; y1: number; x2: number; y2: number; }
export interface RelLine { x1: number; y1: number; x2: number; y2: number; }

export interface PaletteItem { kind: string; label: string; }
export interface PaletteGroup { id: string; title: string; items: PaletteItem[]; }

/* Kinds que inician modo-conexión en lugar de soltar un nodo */
const RELATION_KINDS = new Set(['dependencia', 'importacion', 'acceso']);

/* Fallbacks de tamaño de nodo antes de que el DOM esté listo */
const NODE_DEFAULT_W = 180;
const NODE_DEFAULT_H = 80;

@Component({
    selector: 'app-canvas-paquetes',
    standalone: true,
    imports: [CommonModule, ConfirmModalComponent],
    templateUrl: './canvasPaquetes.component.html',
    styleUrls: ['./canvasPaquetes.component.css']
})
export class CanvasPaquetesComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: PkgCanvasNode[] = [];
    relations: PkgRelation[] = [];

    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

    /* drag-move state */
    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private hasPendingNodeMove = false;

    /* relation-connect state */
    pendingRelation: PendingRelation | null = null;
    ghostLine: GhostLine | null = null;

    /* SVG overlay size */
    stageSize = { w: 800, h: 520 };
    private needsSizeUpdate = false;
    private sizeUpdateScheduled = false;

    /* Accordion state */
    collapsedGroups = new Set<string>();

    showConfirmModal = false;
    confirmModalConfig: ConfirmModalConfig = {
        title: '¿Guardar cambios?',
        message: 'Se actualizará el diagrama actual con los cambios del canvas.',
        confirmText: 'Guardar',
        cancelText: 'Cancelar',
        type: 'info',
        icon: 'info'
    };
    private pendingAction: 'save' | 'clear' | null = null;
    private loadedDiagramId: string | null = null;

    readonly paletteGroups: PaletteGroup[] = [
        {
            id: 'elementos', title: 'Elementos',
            items: [
                { kind: 'paquete', label: 'Paquete' },
                { kind: 'subpaquete', label: 'Subpaquete' },
                { kind: 'nota', label: 'Nota / Comentario' },
            ],
        },
        {
            id: 'relaciones', title: 'Relaciones',
            items: [
                { kind: 'dependencia', label: 'Dependencia' },
                { kind: 'importacion', label: 'Importación' },
                { kind: 'acceso', label: 'Acceso' },
            ],
        },
        {
            id: 'extras', title: 'Extras',
            items: [
                { kind: 'agrupacion', label: 'Agrupación' },
                { kind: 'nota-extra', label: 'Nota / Comentario' },
            ],
        },
    ];

    constructor(private diagramaApiService: DiagramaApiService) { }

    ngOnInit(): void {
        this.loadFromDiagram();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['diagram'] && this.diagram) {
            this.loadFromDiagram();
        }
    }

    ngAfterViewChecked(): void {
        if (this.needsSizeUpdate) {
            this.needsSizeUpdate = false;
            this.scheduleStageSizeUpdate();
        }
    }

    ngOnDestroy(): void { this.removeDragListeners(); }

    /* ── Accordion ── */
    toggleGroup(id: string): void {
        this.collapsedGroups.has(id)
            ? this.collapsedGroups.delete(id)
            : this.collapsedGroups.add(id);
    }

    isGroupCollapsed(id: string): boolean {
        return this.collapsedGroups.has(id);
    }

    /* ── Canvas actions ── */
    guardarLienzo(): void { this.requestSave(); }

    clearCanvas(): void { this.requestClear(); }

    /* ── Inline editing ── */
    onNameBlur(event: FocusEvent, nodeId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.canvasNodes = this.canvasNodes.map(n =>
            n.id === nodeId ? { ...n, label: text || n.label } : n
        );
        this.persistAll();
    }

    onNoteBlur(event: FocusEvent, nodeId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.canvasNodes = this.canvasNodes.map(n =>
            n.id === nodeId ? { ...n, noteText: text } : n
        );
        this.persistAll();
    }

    blurTarget(event: Event): void {
        (event.target as HTMLElement).blur();
        event.preventDefault();
    }

    /* ── Palette drag ── */
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

        /* Relaciones → entrar en modo conexión */
        if (RELATION_KINDS.has(kind)) {
            this.pendingRelation = { kind };
            return;
        }

        const stage = event.currentTarget;
        if (!(stage instanceof HTMLElement)) return;
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - 80, 12, rect.width - 200);
        const y = this.clamp(event.clientY - rect.top - 30, 12, rect.height - 100);

        const node: PkgCanvasNode = {
            id: this.buildId(),
            kind,
            label: this.buildNodeLabel(kind, label),
            x,
            y,
            ...(kind === 'nota' || kind === 'nota-extra'
                ? { noteText: 'Escribe tu nota aquí...' }
                : {}),
        };

        this.canvasNodes = [...this.canvasNodes, node];
        this.needsSizeUpdate = true;
        this.persistAll();
    }

    /* ── Stage click: maneja modo conexión (nodo O línea existente) ── */
    onStageClick(event: MouseEvent): void {
        if (!this.pendingRelation) return;

        const targetEl = event.target as Element;
        const relEl = targetEl.closest('[data-rel-id]');
        const nodeEl = targetEl.closest('[data-node-id]');

        let clickedId: string | null = null;
        if (relEl) {
            clickedId = relEl.getAttribute('data-rel-id');
        } else if (nodeEl) {
            clickedId = nodeEl.getAttribute('data-node-id');
        }

        if (!clickedId) { this.cancelRelation(); return; }
        this.handleRelationClick(clickedId);
    }

    onNodeConnect(nodeId: string, event: MouseEvent): void {
        if (!this.pendingRelation) return;
        event.stopPropagation();
        this.handleRelationClick(nodeId);
    }

    /* ── Stage mousemove: línea fantasma ── */
    onStageMouseMove(event: MouseEvent): void {
        if (!this.pendingRelation?.sourceId) { this.ghostLine = null; return; }
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const srcPt = this.resolveCenter(this.pendingRelation.sourceId);
        if (!srcPt) return;
        this.ghostLine = {
            x1: srcPt.x, y1: srcPt.y,
            x2: event.clientX - rect.left,
            y2: event.clientY - rect.top,
        };
    }

    cancelRelation(): void { this.pendingRelation = null; this.ghostLine = null; }

    private handleRelationClick(clickedId: string): void {
        if (!this.pendingRelation) return;

        if (!this.pendingRelation.sourceId) {
            this.pendingRelation = { ...this.pendingRelation, sourceId: clickedId };
            return;
        }

        if (clickedId === this.pendingRelation.sourceId) return;
        const rel: PkgRelation = {
            id: this.buildId(),
            kind: this.pendingRelation.kind,
            sourceId: this.pendingRelation.sourceId,
            targetId: clickedId,
        };
        this.relations = [...this.relations, rel];
        this.pendingRelation = null;
        this.ghostLine = null;
        this.persistAll();
    }

    /* ── Clic en el punto medio de una relación (línea con línea) ── */
    onRelMidpointClick(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (!this.pendingRelation) return;

        if (!this.pendingRelation.sourceId) {
            this.pendingRelation = { ...this.pendingRelation, sourceId: relId };
        } else {
            if (relId === this.pendingRelation.sourceId) return;
            const rel: PkgRelation = {
                id: this.buildId(),
                kind: this.pendingRelation.kind,
                sourceId: this.pendingRelation.sourceId,
                targetId: relId,
            };
            this.relations = [...this.relations, rel];
            this.pendingRelation = null;
            this.ghostLine = null;
            this.persistAll();
        }
    }

    /* ── Eliminar relación (cascada sobre dependientes) ── */
    removeRelation(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.relations = this.relations.filter(
            r => r.id !== relId && r.sourceId !== relId && r.targetId !== relId
        );
        this.persistAll();
    }

    /* ── Drag de nodos ── */
    startNodeDrag(event: PointerEvent, nodeId: string): void {
        if (this.pendingRelation) return;
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find(n => n.id === nodeId);
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
        this.canvasNodes = this.canvasNodes.filter(n => n.id !== nodeId);
        this.relations = this.relations.filter(r => r.sourceId !== nodeId && r.targetId !== nodeId);
        this.persistAll();
    }

    /* ── SVG line helpers ── */
    getRelLine(rel: PkgRelation): RelLine | null {
        const srcPt = this.resolveEndpoint(rel.sourceId, rel.targetId);
        const tgtPt = this.resolveEndpoint(rel.targetId, rel.sourceId);
        if (!srcPt || !tgtPt) return null;
        return { x1: srcPt.x, y1: srcPt.y, x2: tgtPt.x, y2: tgtPt.y };
    }

    /** Devuelve el centro de cualquier elemento (nodo o relación) dado su ID */
    resolveCenter(id: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === id);
        if (node) return this.nodeCenter(node);
        return this.getRelCenter(id);
    }

    /** Punto medio de una relación ya dibujada */
    getRelCenter(relId: string): { x: number; y: number } | null {
        const rel = this.relations.find(r => r.id === relId);
        if (!rel) return null;
        const sc = this.resolveCenter(rel.sourceId);
        const tc = this.resolveCenter(rel.targetId);
        if (!sc || !tc) return null;
        return { x: (sc.x + tc.x) / 2, y: (sc.y + tc.y) / 2 };
    }

    /**
     * Punto de conexión de fromId apuntando hacia towardId.
     * - Nodo: calcula intersección con el borde del rectángulo.
     * - Relación: devuelve su punto medio.
     */
    resolveEndpoint(fromId: string, towardId: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === fromId);
        if (node) {
            const toCenter = this.resolveCenter(towardId);
            if (!toCenter) return null;
            const fromCenter = this.nodeCenter(node);
            return this.nodeBorderPoint(node, fromCenter, toCenter);
        }
        return this.getRelCenter(fromId);
    }

    relColor(kind: string): string {
        const map: Record<string, string> = {
            dependencia: '#fbbf24',
            importacion: '#fbbf24',
            acceso: '#34d399',
        };
        return map[kind] ?? '#94a3b8';
    }

    relDash(kind: string): string {
        return kind === 'dependencia' || kind === 'importacion' ? '8,4' : 'none';
    }

    relMarkerEnd(kind: string): string {
        if (kind === 'importacion') return `url(#pk-open-${kind})`;
        return `url(#pk-arrow-${kind})`;
    }

    relLabel(kind: string): string {
        if (kind === 'importacion') return '«import»';
        if (kind === 'acceso') return '«access»';
        return '';
    }

    get relMarkerDefs(): Array<{ id: string; type: 'arrow' | 'open'; color: string }> {
        return [
            { id: 'pk-arrow-dependencia', type: 'arrow', color: this.relColor('dependencia') },
            { id: 'pk-open-importacion', type: 'open', color: this.relColor('importacion') },
            { id: 'pk-arrow-acceso', type: 'arrow', color: this.relColor('acceso') },
        ];
    }

    /* ── trackBy ── */
    trackByNode(_: number, n: PkgCanvasNode): string { return n.id; }
    trackByRelation(_: number, r: PkgRelation): string { return r.id; }
    trackByMarkerId(_: number, m: { id: string }): string { return m.id; }

    /* ── Private ── */

    private loadFromDiagram(): void {
        if (!this.diagram) return;
        if (this.loadedDiagramId === this.diagram.id) return;
        this.loadedDiagramId = this.diagram.id;
        const raw = this.diagram as any;
        this.canvasNodes = ((raw.nodes ?? []) as PkgCanvasNode[]).map(n => ({ ...n }));
        this.relations = (raw.relations ?? []) as PkgRelation[];
        this.pendingRelation = null;
        this.ghostLine = null;
        this.needsSizeUpdate = true;
        if (this.canvasNodes.length === 0) {
            this.canvasNodes = this.buildStarterNodes();
            this.persistAll();
        }
    }

    private requestSave(): void {
        this.pendingAction = 'save';
        this.confirmModalConfig = {
            title: '¿Guardar cambios?',
            message: 'Se actualizará el diagrama actual con los cambios del canvas.',
            confirmText: 'Guardar',
            cancelText: 'Cancelar',
            type: 'info',
            icon: 'info'
        };
        this.showConfirmModal = true;
    }

    private requestClear(): void {
        if (this.canvasNodes.length === 0 && this.relations.length === 0) return;
        this.pendingAction = 'clear';
        this.confirmModalConfig = {
            title: '¿Limpiar diagrama?',
            message: 'Se eliminarán todos los nodos y relaciones del canvas. Esta acción no se puede deshacer.',
            confirmText: 'Limpiar',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'trash'
        };
        this.showConfirmModal = true;
    }

    onConfirmModal(): void {
        if (this.pendingAction === 'save') {
            this.persistAll();
        } else if (this.pendingAction === 'clear') {
            this.clearCanvasInternal();
        }
        this.closeConfirm();
    }

    onCancelModal(): void {
        this.closeConfirm();
    }

    private closeConfirm(): void {
        this.showConfirmModal = false;
        this.pendingAction = null;
    }

    private clearCanvasInternal(): void {
        this.canvasNodes = [];
        this.relations = [];
        this.pendingRelation = null;
        this.ghostLine = null;
        this.persistAll();
    }

    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 200);
        const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 60);
        this.canvasNodes = this.canvasNodes.map(n =>
            n.id !== this.draggingNodeId ? n : { ...n, x, y }
        );
        this.hasPendingNodeMove = true;
    };

    private readonly onWindowPointerUp = (): void => {
        if (!this.draggingNodeId) { this.removeDragListeners(); return; }
        this.draggingNodeId = null;
        this.removeDragListeners();
        if (this.hasPendingNodeMove) { this.persistAll(); this.hasPendingNodeMove = false; }
    };

    private nodeCenter(node: PkgCanvasNode): { x: number; y: number } {
        const el = this.canvasStageRef?.nativeElement
            ?.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement | null;
        const w = (el && el.offsetWidth > 0) ? el.offsetWidth : NODE_DEFAULT_W;
        const h = (el && el.offsetHeight > 0) ? el.offsetHeight : NODE_DEFAULT_H;
        return { x: node.x + w / 2, y: node.y + h / 2 };
    }

    private nodeBorderPoint(
        node: PkgCanvasNode,
        from: { x: number; y: number },
        to: { x: number; y: number }
    ): { x: number; y: number } {
        const el = this.canvasStageRef?.nativeElement
            ?.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement | null;
        const w = (el && el.offsetWidth > 0) ? el.offsetWidth : NODE_DEFAULT_W;
        const h = (el && el.offsetHeight > 0) ? el.offsetHeight : NODE_DEFAULT_H;

        const cx = node.x + w / 2;
        const cy = node.y + h / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        const hw = w / 2;
        const hh = h / 2;
        const candidates: number[] = [];

        if (dx !== 0) {
            const t = (dx > 0 ? hw : -hw) / dx;
            const y = cy + t * dy;
            if (y >= cy - hh && y <= cy + hh) candidates.push(t);
        }
        if (dy !== 0) {
            const t = (dy > 0 ? hh : -hh) / dy;
            const x = cx + t * dx;
            if (x >= cx - hw && x <= cx + hw) candidates.push(t);
        }

        const t = candidates.length ? Math.min(...candidates) : 0;
        return { x: cx + t * dx, y: cy + t * dy };
    }

    private updateStageSize(): void {
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        this.stageSize = { w: stage.offsetWidth, h: stage.offsetHeight };
    }

    private scheduleStageSizeUpdate(): void {
        if (this.sizeUpdateScheduled) return;
        this.sizeUpdateScheduled = true;
        setTimeout(() => {
            this.sizeUpdateScheduled = false;
            this.updateStageSize();
        }, 0);
    }

    private buildStarterNodes(): PkgCanvasNode[] {
        return [
            { id: this.buildId(), kind: 'paquete', label: 'Paquete 1', x: 56, y: 72 },
            { id: this.buildId(), kind: 'subpaquete', label: 'Subpaquete 1', x: 300, y: 80 },
        ];
    }

    private buildNodeLabel(kind: string, base: string): string {
        const count = this.canvasNodes.filter(n => n.kind === kind).length + 1;
        return `${base} ${count}`;
    }

    private persistAll(): void {
        if (!this.diagram) return;
        const payload = {
            nodes: this.canvasNodes.map(n => ({ ...n })),
            relations: this.relations,
        } as any;
        this.diagramaApiService.update(this.diagram.id, payload).subscribe({
            next: (updated) => this.diagramUpdated.emit(updated),
            error: (err: unknown) => console.error('Error al guardar canvas:', err),
        });
    }

    private clamp(v: number, min: number, max: number): number {
        return max <= min ? min : Math.min(Math.max(v, min), max);
    }

    private buildId(): string {
        return typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private removeDragListeners(): void {
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }
}