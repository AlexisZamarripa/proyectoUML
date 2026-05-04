import {
    AfterViewChecked, Component, ElementRef, EventEmitter,
    Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../../../components/confirm-modal/confirm-modal.component';

/* ── interfaces ── */
export interface UmlMember { visibility: string; text: string; }

export interface UmlCanvasNode extends CanvasNode {
    stereotype?: string;
    attributes: UmlMember[];
    methods: UmlMember[];
    noteText?: string;
}

export interface UmlRelation {
    id: string;
    kind: string;
    sourceId: string;
    targetId: string;
    label?: string;
}

export interface PendingRelation { kind: string; sourceId?: string; }
export interface GhostLine { x1: number; y1: number; x2: number; y2: number; }
export interface RelLine { x1: number; y1: number; x2: number; y2: number; }

export interface PaletteGroup { groupId: string; groupLabel: string; icon: string; items: PaletteItem[]; }
export interface PaletteItem { kind: string; label: string; hint: string; icon: string; badge?: string; }

/* ── relation kinds ── */
const RELATION_KINDS = new Set([
    'asociacion', 'herencia', 'agregacion', 'composicion',
    'dependencia', 'realizacion', 'navegabilidad', 'multiplicidad'
]);

/* Dimensiones por defecto cuando el nodo aún no tiene tamaño en el DOM */
const NODE_DEFAULT_W = 200;
const NODE_DEFAULT_H = 100;

@Component({
    selector: 'app-canvas-clases',
    standalone: true,
    imports: [CommonModule, ConfirmModalComponent],
    templateUrl: './canvas-clases.component.html',
    styleUrls: ['./canvas-clases.component.css']
})
export class CanvasClasesComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: UmlCanvasNode[] = [];
    relations: UmlRelation[] = [];

    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;

    /* drag-move state */
    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private hasPendingNodeMove = false;

    /* relation-connect state */
    pendingRelation: PendingRelation | null = null;
    ghostLine: GhostLine | null = null;

    /* SVG size */
    stageSize = { w: 800, h: 520 };
    private needsSizeUpdate = false;
    private sizeUpdateScheduled = false;

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
            groupId: 'figuras', groupLabel: 'Figuras', icon: '⬜',
            items: [
                { kind: 'clase', label: 'Clase', hint: '', icon: '🟦', badge: 'C' },
                { kind: 'clase-abstracta', label: 'Clase abstracta', hint: '', icon: '🟧', badge: 'A' },
                { kind: 'interfaz', label: 'Interfaz', hint: '', icon: '🟩', badge: '«I»' },
                { kind: 'enumeracion', label: 'Enumeración', hint: '', icon: '🟪', badge: '«E»' },
            ]
        },
        {
            groupId: 'componentes', groupLabel: 'Componentes', icon: '🔧',
            items: [
                { kind: 'nombre-clase', label: 'Nombre', hint: '', icon: '🏷️' },
                { kind: 'atributo', label: 'Atributo', hint: '', icon: '📌' },
                { kind: 'metodo', label: 'Método', hint: '', icon: '⚙️' },
                { kind: 'visibilidad', label: 'Visibilidad', hint: '', icon: '🔐' },
            ]
        },
        {
            groupId: 'relaciones', groupLabel: 'Relaciones', icon: '🔗',
            items: [
                { kind: 'asociacion', label: 'Asociación', hint: '', icon: '─' },
                { kind: 'herencia', label: 'Herencia', hint: '', icon: '▷' },
                { kind: 'agregacion', label: 'Agregación', hint: '', icon: '◇' },
                { kind: 'composicion', label: 'Composición', hint: '', icon: '◆' },
                { kind: 'dependencia', label: 'Dependencia', hint: '', icon: '⇢' },
                { kind: 'realizacion', label: 'Realización', hint: '', icon: '⇠' },
            ]
        },
        {
            groupId: 'extras', groupLabel: 'Extras', icon: '✨',
            items: [
                { kind: 'multiplicidad', label: 'Multiplicidad', hint: '', icon: '🔢' },
                { kind: 'navegabilidad', label: 'Navegabilidad', hint: '', icon: '🧭' },
                { kind: 'nota', label: 'Nota', hint: '', icon: '📝' },
            ]
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

    /* ── Group collapse ── */
    toggleGroup(id: string): void {
        this.collapsedGroups.has(id) ? this.collapsedGroups.delete(id) : this.collapsedGroups.add(id);
    }
    isGroupCollapsed(id: string): boolean { return this.collapsedGroups.has(id); }

    /* ── Canvas actions ── */
    guardarLienzo(): void { this.requestSave(); }
    clearCanvas(): void { this.requestClear(); }

    /* ── Palette drag start ── */
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
        if (!kind || !label) return;

        /* Relaciones: entrar en modo conexión en lugar de soltar un nodo */
        if (RELATION_KINDS.has(kind)) {
            this.pendingRelation = { kind };
            return;
        }

        const stage = event.currentTarget;
        if (!(stage instanceof HTMLElement)) return;
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - 80, 12, rect.width - 210);
        const y = this.clamp(event.clientY - rect.top - 30, 12, rect.height - 130);

        this.canvasNodes = [...this.canvasNodes, this.buildNode(kind, label, x, y)];
        this.needsSizeUpdate = true;
        this.persistAll();
    }

    /* ── Stage click: handles connection mode ── */
    onStageClick(event: MouseEvent): void {
        if (!this.pendingRelation) return;

        /* Usamos Element (ancestro común de HTMLElement y SVGElement) para
           evitar el error TS2352 de tipos incompatibles. */
        const targetEl = event.target as Element;
        const relEl = targetEl.closest('[data-rel-id]');
        const nodeEl = targetEl.closest('[data-node-id]');

        /* Determinar el ID del elemento clicado (nodo o relación) */
        let clickedId: string | null = null;
        if (relEl) {
            clickedId = relEl.getAttribute('data-rel-id');
        } else if (nodeEl) {
            clickedId = nodeEl.getAttribute('data-node-id');
        }

        /* Si el clic fue en espacio vacío → cancelar */
        if (!clickedId) {
            this.cancelRelation();
            return;
        }
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

        /* El origen puede ser un nodo o una relación */
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
            /* Primer clic: fijar origen */
            this.pendingRelation = { ...this.pendingRelation, sourceId: clickedId };
            return;
        }

        /* Segundo clic: fijar destino y crear relación */
        if (clickedId === this.pendingRelation.sourceId) return;
        const rel: UmlRelation = {
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

    /* ── Clic en el punto medio de una relación (para conectar línea con línea) ── */
    onRelMidpointClick(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (!this.pendingRelation) return;

        if (!this.pendingRelation.sourceId) {
            /* Primer clic: usar esta relación como origen */
            this.pendingRelation = { ...this.pendingRelation, sourceId: relId };
        } else {
            /* Segundo clic: usar esta relación como destino */
            if (relId === this.pendingRelation.sourceId) return;
            const rel: UmlRelation = {
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

    /* ── Remove relation ── */
    removeRelation(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        /* También eliminar relaciones que dependan de esta */
        this.relations = this.relations.filter(
            r => r.id !== relId && r.sourceId !== relId && r.targetId !== relId
        );
        this.persistAll();
    }

    /* ── Node pointer: drag-move or connect ── */
    onNodePointerDown(event: PointerEvent, nodeId: string): void {
        /* En modo conexión dejamos que el click handler lo gestione */
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

    /* ── Inline editing ── */
    onNameBlur(event: FocusEvent, nodeId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.updateNode(nodeId, n => ({ ...n, label: text || n.label }));
    }
    onAttrBlur(event: FocusEvent, nodeId: string, index: number): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.updateNode(nodeId, n => {
            const attrs = [...n.attributes];
            attrs[index] = { ...attrs[index], text: text || attrs[index].text };
            return { ...n, attributes: attrs };
        });
    }
    onMethodBlur(event: FocusEvent, nodeId: string, index: number): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.updateNode(nodeId, n => {
            const methods = [...n.methods];
            methods[index] = { ...methods[index], text: text || methods[index].text };
            return { ...n, methods };
        });
    }
    onNoteBlur(event: FocusEvent, nodeId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.updateNode(nodeId, n => ({ ...n, noteText: text }));
    }
    addAttr(nodeId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.updateNode(nodeId, n => ({ ...n, attributes: [...n.attributes, { visibility: '+', text: 'atributo: Tipo' }] }));
    }
    removeAttr(nodeId: string, index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.updateNode(nodeId, n => ({ ...n, attributes: n.attributes.filter((_, i) => i !== index) }));
    }
    addMethod(nodeId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.updateNode(nodeId, n => ({ ...n, methods: [...n.methods, { visibility: '+', text: 'metodo(): void' }] }));
    }
    removeMethod(nodeId: string, index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.updateNode(nodeId, n => ({ ...n, methods: n.methods.filter((_, i) => i !== index) }));
    }
    blurTarget(event: Event): void {
        (event.target as HTMLElement).blur();
        event.preventDefault();
    }

    /* ── SVG line for a relation ── */
    getRelLine(rel: UmlRelation): RelLine | null {
        const srcPt = this.resolveEndpoint(rel.sourceId, rel.targetId);
        const tgtPt = this.resolveEndpoint(rel.targetId, rel.sourceId);
        if (!srcPt || !tgtPt) return null;
        return { x1: srcPt.x, y1: srcPt.y, x2: tgtPt.x, y2: tgtPt.y };
    }

    /* Devuelve si un ID pertenece a una relación */
    isRelationId(id: string): boolean {
        return this.relations.some(r => r.id === id);
    }

    /* Punto medio de una relación ya dibujada */
    getRelCenter(relId: string): { x: number; y: number } | null {
        const rel = this.relations.find(r => r.id === relId);
        if (!rel) return null;
        /* Evitar recursión infinita: solo resolver si src/tgt son nodos */
        const srcNode = this.canvasNodes.find(n => n.id === rel.sourceId);
        const tgtNode = this.canvasNodes.find(n => n.id === rel.targetId);
        if (!srcNode || !tgtNode) {
            /* Si alguno de los extremos ya es una relación, usar su centro directo */
            const sc = this.resolveCenter(rel.sourceId);
            const tc = this.resolveCenter(rel.targetId);
            if (!sc || !tc) return null;
            return { x: (sc.x + tc.x) / 2, y: (sc.y + tc.y) / 2 };
        }
        const sc = this.nodeCenter(srcNode);
        const tc = this.nodeCenter(tgtNode);
        return { x: (sc.x + tc.x) / 2, y: (sc.y + tc.y) / 2 };
    }

    /**
     * Resuelve el CENTRO de cualquier elemento (nodo o relación) dado su ID.
     * Usado para la ghost line y para resolver endpoints de relaciones encadenadas.
     */
    resolveCenter(id: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === id);
        if (node) return this.nodeCenter(node);
        return this.getRelCenter(id);
    }

    /**
     * Resuelve el punto de conexión de `fromId` apuntando hacia `towardId`.
     * - Si fromId es un nodo: calcula el punto en el borde del rectángulo.
     * - Si fromId es una relación: devuelve el punto medio de esa línea.
     */
    resolveEndpoint(fromId: string, towardId: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === fromId);
        if (node) {
            const toCenter = this.resolveCenter(towardId);
            if (!toCenter) return null;
            const fromCenter = this.nodeCenter(node);
            return this.nodeBorderPoint(node, fromCenter, toCenter);
        }
        /* Es una relación: devolver su punto medio */
        return this.getRelCenter(fromId);
    }

    /* ── Relation styling helpers ── */
    relColor(kind: string): string {
        const map: Record<string, string> = {
            asociacion: '#94a3b8',
            navegabilidad: '#94a3b8',
            herencia: '#60a5fa',
            realizacion: '#60a5fa',
            agregacion: '#f87171',
            composicion: '#f87171',
            dependencia: '#fbbf24',
            multiplicidad: '#a78bfa',
        };
        return map[kind] ?? '#94a3b8';
    }

    relDash(kind: string): string {
        return kind === 'dependencia' || kind === 'realizacion' ? '8,4' : 'none';
    }

    relMarkerEnd(kind: string): string {
        const map: Record<string, string> = {
            navegabilidad: `url(#mk-arrow-${kind})`,
            herencia: `url(#mk-open-${kind})`,
            realizacion: `url(#mk-open-${kind})`,
            agregacion: `url(#mk-arrow-${kind})`,
            composicion: `url(#mk-arrow-${kind})`,
            dependencia: `url(#mk-arrow-${kind})`,
            multiplicidad: '',
            asociacion: '',
        };
        return map[kind] ?? '';
    }

    relMarkerStart(kind: string): string {
        if (kind === 'agregacion') return `url(#mk-diamond-${kind})`;
        if (kind === 'composicion') return `url(#mk-diamondf-${kind})`;
        return '';
    }

    get relMarkerDefs(): Array<{ id: string; type: 'arrow' | 'open' | 'diamond' | 'diamondf'; color: string }> {
        return [
            { id: 'mk-arrow-navegabilidad', type: 'arrow', color: this.relColor('navegabilidad') },
            { id: 'mk-open-herencia', type: 'open', color: this.relColor('herencia') },
            { id: 'mk-open-realizacion', type: 'open', color: this.relColor('realizacion') },
            { id: 'mk-arrow-agregacion', type: 'arrow', color: this.relColor('agregacion') },
            { id: 'mk-diamond-agregacion', type: 'diamond', color: this.relColor('agregacion') },
            { id: 'mk-arrow-composicion', type: 'arrow', color: this.relColor('composicion') },
            { id: 'mk-diamondf-composicion', type: 'diamondf', color: this.relColor('composicion') },
            { id: 'mk-arrow-dependencia', type: 'arrow', color: this.relColor('dependencia') },
        ];
    }

    /* ── Template helpers ── */
    isClassLike(kind: string): boolean {
        return kind === 'clase' || kind === 'clase-abstracta';
    }

    nodeIcon(kind: string): string {
        for (const g of this.paletteGroups) {
            const found = g.items.find(i => i.kind === kind);
            if (found) return found.icon;
        }
        return '📦';
    }

    trackByNode(_: number, n: UmlCanvasNode): string { return n.id; }
    trackByRelation(_: number, r: UmlRelation): string { return r.id; }
    trackByGroup(_: number, g: PaletteGroup): string { return g.groupId; }
    trackByItem(_: number, i: PaletteItem): string { return i.kind; }
    trackByIndex(index: number): number { return index; }
    trackByMarkerId(_: number, m: { id: string }): string { return m.id; }

    /* ─────────────────────────── PRIVATE ─────────────────────────── */

    private loadFromDiagram(): void {
        if (!this.diagram) return;
        if (this.loadedDiagramId === this.diagram.id) return;
        this.loadedDiagramId = this.diagram.id;
        const raw = this.diagram as any;
        this.canvasNodes = ((raw.nodes ?? []) as UmlCanvasNode[]).map(n => this.hydrateNode(n));
        this.relations = (raw.relations ?? []) as UmlRelation[];
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
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 210);
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

    private nodeCenter(node: UmlCanvasNode): { x: number; y: number } {
        const el = this.canvasStageRef?.nativeElement
            ?.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement | null;
        const w = (el && el.offsetWidth > 0) ? el.offsetWidth : NODE_DEFAULT_W;
        const h = (el && el.offsetHeight > 0) ? el.offsetHeight : NODE_DEFAULT_H;
        return { x: node.x + w / 2, y: node.y + h / 2 };
    }

    private nodeBorderPoint(
        node: UmlCanvasNode,
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

    private buildNode(kind: string, baseLabel: string, x: number, y: number): UmlCanvasNode {
        const count = this.canvasNodes.filter(n => n.kind === kind).length + 1;
        const label = `${baseLabel}${count}`;
        const base: UmlCanvasNode = {
            id: this.buildId(), kind, label, x, y,
            icon: this.nodeIcon(kind), badge: '',
            attributes: [], methods: [],
        } as any;

        switch (kind) {
            case 'clase':
                return {
                    ...base,
                    attributes: [{ visibility: '+', text: 'id: int' }, { visibility: '-', text: 'nombre: String' }],
                    methods: [{ visibility: '+', text: 'getId(): int' }, { visibility: '+', text: 'setNombre(n: String): void' }],
                };
            case 'clase-abstracta':
                return {
                    ...base, stereotype: '«abstract»',
                    attributes: [{ visibility: '#', text: 'id: int' }],
                    methods: [{ visibility: '+', text: 'operacion(): void' }],
                };
            case 'interfaz':
                return { ...base, methods: [{ visibility: '+', text: 'ejecutar(): void' }] };
            case 'enumeracion':
                return { ...base, attributes: [{ visibility: '', text: 'VALOR1' }, { visibility: '', text: 'VALOR2' }] };
            case 'nota': case 'nota-extra':
                return { ...base, noteText: 'Escribe tu nota aquí...' };
            default:
                return base;
        }
    }

    private buildStarterNodes(): UmlCanvasNode[] {
        return [
            this.buildNode('clase', 'Clase', 48, 52),
            this.buildNode('interfaz', 'IServicio', 320, 58),
        ];
    }

    private hydrateNode(raw: Partial<UmlCanvasNode>): UmlCanvasNode {
        return { ...raw, attributes: raw.attributes ?? [], methods: raw.methods ?? [], noteText: raw.noteText ?? '' } as UmlCanvasNode;
    }

    private updateNode(nodeId: string, fn: (n: UmlCanvasNode) => UmlCanvasNode): void {
        this.canvasNodes = this.canvasNodes.map(n => n.id === nodeId ? fn(n) : n);
        this.persistAll();
    }

    private persistAll(): void {
        if (!this.diagram) return;
        const payload = { nodes: this.canvasNodes.map(n => ({ ...n })), relations: this.relations } as any;
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
            : `id-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
    }

    private removeDragListeners(): void {
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }
}