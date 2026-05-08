import {
    AfterViewChecked, Component, ElementRef, EventEmitter, HostListener,
    Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../../../components/confirm-modal/confirm-modal.component';

/* ── Interfaces ── */
export interface CuCanvasNode extends CanvasNode {
    noteText?: string;
}

export interface CuRelation {
    id: string;
    kind: string;   /* asociacion | include | extend | generalizacion */
    sourceId: string;
    targetId: string;
    label?: string;
}

export interface PendingRelation { kind: string; sourceId?: string; }
export interface GhostLine { x1: number; y1: number; x2: number; y2: number; }
export interface RelLine { x1: number; y1: number; x2: number; y2: number; }

export interface PaletteItem { kind: string; label: string; }
export interface PaletteGroup { id: string; title: string; items: PaletteItem[]; }

/* Kinds que activan modo-conexión en lugar de soltar un nodo */
const RELATION_KINDS = new Set(['asociacion', 'include', 'extend', 'generalizacion']);

/* Fallbacks de tamaño de nodo antes de que el DOM esté listo */
const NODE_DEFAULT_W = 180;
const NODE_DEFAULT_H = 80;

/* Límites de zoom */
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.04;
const ZOOM_WHEEL_FACTOR = 0.06;

/* Velocidad de scroll con rueda (pan sin Ctrl) */
const PAN_WHEEL_SPEED = 1.2;

@Component({
    selector: 'app-canvas-casos-uso',
    standalone: true,
    imports: [CommonModule, ConfirmModalComponent],
    templateUrl: './canvas-casos-uso.component.html',
    styleUrls: ['./canvas-casos-uso.component.css']
})
export class CanvasCasosUsoComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: CuCanvasNode[] = [];
    relations: CuRelation[] = [];

    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;
    @ViewChild('stageWrapper') stageWrapperRef?: ElementRef<HTMLDivElement>;

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

    // ══════════════════════════════════════════
    //  ZOOM & PAN — estado
    // ══════════════════════════════════════════

    /** Escala actual del canvas (1 = 100%). */
    zoom = 1;

    /** Traslación acumulada en píxeles del viewport. */
    panX = 0;
    panY = 0;

    /** Estado interno del pan con ratón/teclado. */
    private _isPanning = false;
    private _panStartX = 0;
    private _panStartY = 0;
    private _panOriginX = 0;
    private _panOriginY = 0;
    private _spaceDown = false;

    /** String CSS aplicado al canvas-stage via [style.transform]. */
    get stageTransform(): string {
        return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    /** Porcentaje redondeado para mostrar en el badge. */
    get zoomPercent(): number {
        return Math.round(this.zoom * 100);
    }

    // ══════════════════════════════════════════

    readonly paletteGroups: PaletteGroup[] = [
        {
            id: 'figuras', title: 'Figuras',
            items: [
                { kind: 'actor', label: 'Actor' },
                { kind: 'caso', label: 'Caso de uso' },
                { kind: 'sistema', label: 'Límite del sistema' },
                { kind: 'nota', label: 'Nota / Comentario' },
            ],
        },
        {
            id: 'relaciones', title: 'Relaciones',
            items: [
                { kind: 'asociacion', label: 'Asociación' },
                { kind: 'include', label: 'Include' },
                { kind: 'extend', label: 'Extend' },
                { kind: 'generalizacion', label: 'Generalización' },
            ],
        },
        {
            id: 'extras', title: 'Extras',
            items: [
                { kind: 'agrupacion', label: 'Agrupación' },
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

    ngOnDestroy(): void {
        this.removeDragListeners();
        window.removeEventListener('mousemove', this._onPanMouseMove);
        window.removeEventListener('mouseup', this._onPanMouseUp);
    }

    /* ── Accordion ── */
    toggleGroup(id: string): void {
        this.collapsedGroups.has(id) ? this.collapsedGroups.delete(id) : this.collapsedGroups.add(id);
    }
    isGroupCollapsed(id: string): boolean { return this.collapsedGroups.has(id); }

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

        /* Relaciones → modo conexión */
        if (RELATION_KINDS.has(kind)) {
            this.pendingRelation = { kind };
            return;
        }

        const wrapper = this.stageWrapperRef?.nativeElement;
        if (!wrapper) return;

        /* Convertir coordenadas del viewport al espacio del canvas (zoom + pan) */
        const pos = this.viewportToCanvas(event.clientX, event.clientY);
        const x = Math.max(12, pos.x - 60);
        const y = Math.max(12, pos.y - 30);

        const node: CuCanvasNode = {
            id: this.buildId(),
            kind,
            label: this.buildNodeLabel(kind, label),
            x,
            y,
            ...(kind === 'nota' ? { noteText: 'Escribe tu nota aquí...' } : {}),
        };

        this.canvasNodes = [...this.canvasNodes, node];
        this.needsSizeUpdate = true;
        this.persistAll();
    }

    /* ── Stage click: maneja modo conexión ── */
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

    /* ── Stage mousemove: ghost line ── */
    onStageMouseMove(event: MouseEvent): void {
        if (!this.pendingRelation?.sourceId) { this.ghostLine = null; return; }
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();

        const srcPt = this.resolveCenter(this.pendingRelation.sourceId);
        if (!srcPt) return;

        this.ghostLine = {
            x1: srcPt.x, y1: srcPt.y,
            x2: (event.clientX - rect.left) / this.zoom,
            y2: (event.clientY - rect.top) / this.zoom,
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
        const rel: CuRelation = {
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

    /* ── Clic en el punto medio de una relación ── */
    onRelMidpointClick(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (!this.pendingRelation) return;

        if (!this.pendingRelation.sourceId) {
            this.pendingRelation = { ...this.pendingRelation, sourceId: relId };
        } else {
            if (relId === this.pendingRelation.sourceId) return;
            const rel: CuRelation = {
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

    /* ── Eliminar relación ── */
    removeRelation(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.relations = this.relations.filter(
            r => r.id !== relId && r.sourceId !== relId && r.targetId !== relId
        );
        this.persistAll();
    }

    /* ── Drag de nodos ── */
    onNodePointerDown(event: PointerEvent, nodeId: string): void {
        if (this.pendingRelation) return;
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find(n => n.id === nodeId);
        if (!stage || !node) return;
        const rect = stage.getBoundingClientRect();

        this.draggingNodeId = nodeId;
        this.dragOffsetX = (event.clientX - rect.left) / this.zoom - node.x;
        this.dragOffsetY = (event.clientY - rect.top) / this.zoom - node.y;
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
    getRelLine(rel: CuRelation): RelLine | null {
        const srcPt = this.resolveEndpoint(rel.sourceId, rel.targetId);
        const tgtPt = this.resolveEndpoint(rel.targetId, rel.sourceId);
        if (!srcPt || !tgtPt) return null;
        return { x1: srcPt.x, y1: srcPt.y, x2: tgtPt.x, y2: tgtPt.y };
    }

    resolveCenter(id: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === id);
        if (node) return this.nodeCenter(node);
        return this.getRelCenter(id);
    }

    getRelCenter(relId: string): { x: number; y: number } | null {
        const rel = this.relations.find(r => r.id === relId);
        if (!rel) return null;
        const sc = this.resolveCenter(rel.sourceId);
        const tc = this.resolveCenter(rel.targetId);
        if (!sc || !tc) return null;
        return { x: (sc.x + tc.x) / 2, y: (sc.y + tc.y) / 2 };
    }

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
            asociacion: '#94a3b8',
            include: '#fbbf24',
            extend: '#fb923c',
            generalizacion: '#60a5fa',
        };
        return map[kind] ?? '#94a3b8';
    }

    relDash(kind: string): string {
        return kind === 'include' || kind === 'extend' ? '8,4' : 'none';
    }

    relMarkerEnd(kind: string): string {
        const map: Record<string, string> = {
            asociacion: '',
            include: `url(#cu-arrow-include)`,
            extend: `url(#cu-arrow-extend)`,
            generalizacion: `url(#cu-open-generalizacion)`,
        };
        return map[kind] ?? '';
    }

    relLabel(kind: string): string {
        if (kind === 'include') return '«include»';
        if (kind === 'extend') return '«extend»';
        return '';
    }

    get relMarkerDefs(): Array<{ id: string; type: 'arrow' | 'open'; color: string }> {
        return [
            { id: 'cu-arrow-include', type: 'arrow', color: this.relColor('include') },
            { id: 'cu-arrow-extend', type: 'arrow', color: this.relColor('extend') },
            { id: 'cu-open-generalizacion', type: 'open', color: this.relColor('generalizacion') },
        ];
    }

    /* ── trackBy ── */
    trackByNode(_: number, n: CuCanvasNode): string { return n.id; }
    trackByRelation(_: number, r: CuRelation): string { return r.id; }
    trackByMarkerId(_: number, m: { id: string }): string { return m.id; }

    // ══════════════════════════════════════════
    //  WHEEL — zoom con Ctrl, pan libre sin Ctrl
    // ══════════════════════════════════════════

    onStageWheel(event: WheelEvent): void {
        event.preventDefault();

        const wrapper = this.stageWrapperRef?.nativeElement;
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();

        if (event.ctrlKey || event.metaKey) {
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const delta = event.deltaY < 0 ? 1 : -1;
            this._applyZoom(1 + delta * ZOOM_WHEEL_FACTOR, mouseX, mouseY);
        } else {
            const factor = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? 100 : 1;
            this.panX -= event.deltaX * factor * PAN_WHEEL_SPEED;
            this.panY -= event.deltaY * factor * PAN_WHEEL_SPEED;
        }
    }

    /* ── Botones +  /  −  /  reset ── */
    zoomIn(): void {
        const w = this.stageWrapperRef?.nativeElement;
        if (!w) return;
        this._applyZoom(1 + ZOOM_STEP, w.clientWidth / 2, w.clientHeight / 2);
    }

    zoomOut(): void {
        const w = this.stageWrapperRef?.nativeElement;
        if (!w) return;
        this._applyZoom(1 - ZOOM_STEP, w.clientWidth / 2, w.clientHeight / 2);
    }

    zoomReset(): void {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
    }

    private _applyZoom(factor: number, focalX: number, focalY: number): void {
        const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * factor));
        if (newZoom === this.zoom) return;
        this.panX = focalX - (focalX - this.panX) * (newZoom / this.zoom);
        this.panY = focalY - (focalY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
    }

    // ══════════════════════════════════════════
    //  PAN — botón medio / Espacio + drag
    // ══════════════════════════════════════════

    onWrapperMouseDown(event: MouseEvent): void {
        const isMiddle = event.button === 1;
        const isSpacePan = this._spaceDown && event.button === 0;
        if (!isMiddle && !isSpacePan) return;

        event.preventDefault();
        this._isPanning = true;
        this._panStartX = event.clientX;
        this._panStartY = event.clientY;
        this._panOriginX = this.panX;
        this._panOriginY = this.panY;
        this.stageWrapperRef?.nativeElement.classList.add('panning');

        window.addEventListener('mousemove', this._onPanMouseMove);
        window.addEventListener('mouseup', this._onPanMouseUp);
    }

    private readonly _onPanMouseMove = (event: MouseEvent): void => {
        if (!this._isPanning) return;
        this.panX = this._panOriginX + (event.clientX - this._panStartX);
        this.panY = this._panOriginY + (event.clientY - this._panStartY);
    };

    private readonly _onPanMouseUp = (): void => {
        if (!this._isPanning) return;
        this._isPanning = false;
        this.stageWrapperRef?.nativeElement.classList.remove('panning');
        window.removeEventListener('mousemove', this._onPanMouseMove);
        window.removeEventListener('mouseup', this._onPanMouseUp);
    };

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.code !== 'Space' || this._spaceDown) return;
        const active = document.activeElement;
        const tag = active?.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (active as HTMLElement)?.isContentEditable) return;
        event.preventDefault();
        this._spaceDown = true;
        if (this.stageWrapperRef) this.stageWrapperRef.nativeElement.style.cursor = 'grab';
    }

    @HostListener('window:keyup', ['$event'])
    onKeyUp(event: KeyboardEvent): void {
        if (event.code !== 'Space') return;
        this._spaceDown = false;
        if (this.stageWrapperRef) this.stageWrapperRef.nativeElement.style.cursor = '';
    }

    // ══════════════════════════════════════════
    //  COORDENADAS — viewport → canvas
    // ══════════════════════════════════════════

    private viewportToCanvas(clientX: number, clientY: number): { x: number; y: number } {
        const wrapper = this.stageWrapperRef?.nativeElement;
        if (!wrapper) return { x: clientX, y: clientY };
        const rect = wrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - this.panX) / this.zoom,
            y: (clientY - rect.top - this.panY) / this.zoom,
        };
    }

    /* ─────────────────────────── PRIVATE ─────────────────────────── */

    private loadFromDiagram(): void {
        if (!this.diagram) return;
        if (this.loadedDiagramId === this.diagram.id) return;
        this.loadedDiagramId = this.diagram.id;
        const raw = this.diagram as any;
        this.canvasNodes = ((raw.nodes ?? []) as CuCanvasNode[]).map(n => ({ ...n }));
        this.relations = ((raw.relations ?? []) as CuRelation[]);
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
        const x = Math.max(12, (event.clientX - rect.left) / this.zoom - this.dragOffsetX);
        const y = Math.max(12, (event.clientY - rect.top) / this.zoom - this.dragOffsetY);
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

    private nodeCenter(node: CuCanvasNode): { x: number; y: number } {
        const el = this.canvasStageRef?.nativeElement
            ?.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement | null;
        const w = (el && el.offsetWidth > 0) ? el.offsetWidth : NODE_DEFAULT_W;
        const h = (el && el.offsetHeight > 0) ? el.offsetHeight : NODE_DEFAULT_H;
        return { x: node.x + w / 2, y: node.y + h / 2 };
    }

    private nodeBorderPoint(
        node: CuCanvasNode,
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

    private buildStarterNodes(): CuCanvasNode[] {
        return [
            { id: this.buildId(), kind: 'actor', label: 'Actor 1', x: 56, y: 120 },
            { id: this.buildId(), kind: 'caso', label: 'Caso de uso 1', x: 260, y: 100 },
            { id: this.buildId(), kind: 'sistema', label: 'Sistema', x: 210, y: 50 },
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
            next: updated => this.diagramUpdated.emit(updated),
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