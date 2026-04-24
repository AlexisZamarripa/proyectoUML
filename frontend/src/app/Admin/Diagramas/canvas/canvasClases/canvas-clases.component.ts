import {
    AfterViewChecked, Component, ElementRef, EventEmitter,
    Input, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

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
    imports: [CommonModule],
    templateUrl: './canvas-clases.component.html',
    styleUrls: ['./canvas-clases.component.css']
})
export class CanvasClasesComponent implements OnInit, OnDestroy, AfterViewChecked {

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

    collapsedGroups = new Set<string>();

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
        if (this.diagram) {
            const raw = this.diagram as any;
            this.canvasNodes = ((raw.nodes ?? []) as UmlCanvasNode[]).map(n => this.hydrateNode(n));
            this.relations = (raw.relations ?? []) as UmlRelation[];
            if (this.canvasNodes.length === 0) {
                this.canvasNodes = this.buildStarterNodes();
                this.persistAll();
            }
        }
    }

    ngAfterViewChecked(): void {
        if (this.needsSizeUpdate) { this.updateStageSize(); this.needsSizeUpdate = false; }
    }

    ngOnDestroy(): void { this.removeDragListeners(); }

    /* ── Group collapse ── */
    toggleGroup(id: string): void {
        this.collapsedGroups.has(id) ? this.collapsedGroups.delete(id) : this.collapsedGroups.add(id);
    }
    isGroupCollapsed(id: string): boolean { return this.collapsedGroups.has(id); }

    /* ── Canvas actions ── */
    guardarLienzo(): void { this.persistAll(); }
    clearCanvas(): void {
        this.canvasNodes = []; this.relations = [];
        this.pendingRelation = null; this.ghostLine = null;
        this.persistAll();
    }

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

        const target = event.target as HTMLElement;

        /* Buscar el nodo más cercano — funciona aunque el clic caiga en un hijo del nodo */
        const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;

        /* Si el clic fue en espacio vacío (stage o SVG de relaciones) → cancelar */
        if (!nodeEl) {
            this.cancelRelation();
            return;
        }

        const nodeId = nodeEl.getAttribute('data-node-id')!;

        if (!this.pendingRelation.sourceId) {
            /* Primer clic: fijar origen */
            this.pendingRelation = { ...this.pendingRelation, sourceId: nodeId };
        } else {
            /* Segundo clic: fijar destino y crear relación */
            if (nodeId === this.pendingRelation.sourceId) return; /* mismo nodo → ignorar */
            const rel: UmlRelation = {
                id: this.buildId(),
                kind: this.pendingRelation.kind,
                sourceId: this.pendingRelation.sourceId,
                targetId: nodeId,
            };
            this.relations = [...this.relations, rel];
            this.pendingRelation = null;
            this.ghostLine = null;
            this.persistAll();
        }
    }

    /* ── Stage mousemove: ghost line ── */
    onStageMouseMove(event: MouseEvent): void {
        if (!this.pendingRelation?.sourceId) { this.ghostLine = null; return; }
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const src = this.canvasNodes.find(n => n.id === this.pendingRelation!.sourceId);
        if (!src) return;
        const srcPt = this.nodeCenter(src);
        this.ghostLine = {
            x1: srcPt.x, y1: srcPt.y,
            x2: event.clientX - rect.left,
            y2: event.clientY - rect.top,
        };
    }

    cancelRelation(): void { this.pendingRelation = null; this.ghostLine = null; }

    /* ── Remove relation ── */
    removeRelation(relId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.relations = this.relations.filter(r => r.id !== relId);
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
        const src = this.canvasNodes.find(n => n.id === rel.sourceId);
        const tgt = this.canvasNodes.find(n => n.id === rel.targetId);
        if (!src || !tgt) return null;
        const sc = this.nodeCenter(src);
        const tc = this.nodeCenter(tgt);
        const p1 = this.nodeBorderPoint(src, sc, tc);
        const p2 = this.nodeBorderPoint(tgt, tc, sc);
        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
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

    /**
     * Devuelve el id del marker de fin de línea.
     * IMPORTANTE: los markers son POR COLOR para que el fill coincida
     * con el stroke de la línea. Los ids siguen el patrón mk-{kind}-{tipo}.
     */
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

    /**
     * Lista de configuraciones de markers para el SVG.
     * El template itera esta lista para generar un <marker> por cada variante
     * con el color correcto hardcodeado, evitando la limitación de context-stroke
     * en navegadores que no lo soportan.
     */
    get relMarkerDefs(): Array<{ id: string; type: 'arrow' | 'open' | 'diamond' | 'diamondf'; color: string }> {
        return [
            /* navegabilidad */
            { id: 'mk-arrow-navegabilidad', type: 'arrow', color: this.relColor('navegabilidad') },
            /* herencia */
            { id: 'mk-open-herencia', type: 'open', color: this.relColor('herencia') },
            /* realizacion */
            { id: 'mk-open-realizacion', type: 'open', color: this.relColor('realizacion') },
            /* agregacion */
            { id: 'mk-arrow-agregacion', type: 'arrow', color: this.relColor('agregacion') },
            { id: 'mk-diamond-agregacion', type: 'diamond', color: this.relColor('agregacion') },
            /* composicion */
            { id: 'mk-arrow-composicion', type: 'arrow', color: this.relColor('composicion') },
            { id: 'mk-diamondf-composicion', type: 'diamondf', color: this.relColor('composicion') },
            /* dependencia */
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

    /**
     * Calcula el centro de un nodo usando las dimensiones reales del DOM.
     */
    private nodeCenter(node: UmlCanvasNode): { x: number; y: number } {
        const el = this.canvasStageRef?.nativeElement
            ?.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement | null;
        const w = (el && el.offsetWidth > 0) ? el.offsetWidth : NODE_DEFAULT_W;
        const h = (el && el.offsetHeight > 0) ? el.offsetHeight : NODE_DEFAULT_H;
        return { x: node.x + w / 2, y: node.y + h / 2 };
    }

    /**
     * Calcula el punto de intersección de la línea (desde→hacia) con el borde
     * rectangular del nodo, para que las flechas salgan/lleguen al borde y no
     * al centro.
     */
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

        /* Si origen y destino coinciden (mismo centro) devolver el centro */
        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        const hw = w / 2;  /* half-width  */
        const hh = h / 2;  /* half-height */

        /* Intersección con cada uno de los 4 lados del rectángulo,
           tomando el t más pequeño positivo (el borde más cercano en
           la dirección del destino). */
        const candidates: number[] = [];

        if (dx !== 0) {
            /* Lado derecho: x = cx + hw  →  t = hw / dx  (si dx > 0) */
            /* Lado izquierdo: x = cx - hw →  t = -hw / dx (si dx < 0) */
            const t = (dx > 0 ? hw : -hw) / dx;
            const y = cy + t * dy;
            if (y >= cy - hh && y <= cy + hh) candidates.push(t);
        }
        if (dy !== 0) {
            /* Lado inferior: y = cy + hh  →  t = hh / dy  (si dy > 0) */
            /* Lado superior: y = cy - hh  →  t = -hh / dy (si dy < 0) */
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