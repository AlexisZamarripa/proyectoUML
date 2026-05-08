import {
    AfterViewChecked, Component, ElementRef, EventEmitter, HostListener,
    Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../../../components/confirm-modal/confirm-modal.component';

/* ── Interfaces ── */
export interface SeqNode extends CanvasNode {
    width?: number;
}

export interface SeqMessage {
    id: string;
    kind: string;        /* msg-sincrono | msg-asincrono | msg-retorno | msg-creacion | msg-destruccion | msg-autoreferencia */
    sourceId: string;
    targetId: string;
    label: string;
    order: number;
}

export interface SeqFragment {
    id: string;
    kind: string;        /* frag-alt | frag-loop | frag-opt | frag-par */
    label: string;
    condition: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PendingMessage { kind: string; sourceId?: string; }
export interface GhostLine { x1: number; y1: number; x2: number; y2: number; }

export interface PaletteItem {
    kind: string;
    label: string;
    hint: string;
    iconType: 'svg' | 'badge' | 'text';
    icon?: string;
}

export interface PaletteGroup {
    id: string;
    title: string;
    collapsed: boolean;
    items: PaletteItem[];
}

const MESSAGE_KINDS = new Set([
    'msg-sincrono', 'msg-asincrono', 'msg-retorno',
    'msg-creacion', 'msg-destruccion', 'msg-autoreferencia'
]);
const FRAGMENT_KINDS = new Set(['frag-alt', 'frag-loop', 'frag-opt', 'frag-par']);

/* Layout constants */
const LIFELINE_HEAD_H = 60;
const LIFELINE_X_GAP = 200;
const LIFELINE_START_X = 80;
const MSG_Y_START = 120;
const MSG_Y_GAP = 60;
const NODE_DEFAULT_W = 140;

/* Límites de zoom */
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.04;
const ZOOM_WHEEL_FACTOR = 0.06;
const PAN_WHEEL_SPEED = 1.2;

@Component({
    selector: 'app-canvas-secuencia',
    standalone: true,
    imports: [CommonModule, ConfirmModalComponent],
    templateUrl: './canvasSecuencia.component.html',
    styleUrls: ['./canvasSecuencia.component.css']
})
export class CanvasSecuenciaComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

    @Input() diagram!: UmlDiagram;
    @Output() diagramUpdated = new EventEmitter<UmlDiagram>();

    canvasNodes: SeqNode[] = [];
    messages: SeqMessage[] = [];
    fragments: SeqFragment[] = [];

    @ViewChild('canvasStage') canvasStageRef?: ElementRef<HTMLDivElement>;
    @ViewChild('stageWrapper') stageWrapperRef?: ElementRef<HTMLDivElement>;

    /* drag participantes */
    draggingNodeId: string | null = null;
    private dragOffsetX = 0;
    private hasPendingNodeMove = false;

    /* drag fragmentos */
    draggingFragId: string | null = null;
    private fragDragOffX = 0;
    private fragDragOffY = 0;

    /* drag resize fragmento */
    resizingFragId: string | null = null;
    private resizeStartX = 0;
    private resizeStartY = 0;
    private resizeStartW = 0;
    private resizeStartH = 0;

    /* modo conexión mensajes */
    pendingMessage: PendingMessage | null = null;
    ghostLine: GhostLine | null = null;

    /* SVG overlay size */
    stageSize = { w: 3000, h: 3000 };
    private needsSizeUpdate = false;
    private sizeUpdateScheduled = false;

    /* accordion */
    collapsedGroups = new Set<string>();

    /* edición inline de mensajes */
    editingMsgId: string | null = null;

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

    zoom = 1;
    panX = 0;
    panY = 0;

    private _isPanning = false;
    private _panStartX = 0;
    private _panStartY = 0;
    private _panOriginX = 0;
    private _panOriginY = 0;
    private _spaceDown = false;

    get stageTransform(): string {
        return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    get zoomPercent(): number {
        return Math.round(this.zoom * 100);
    }

    // ══════════════════════════════════════════

    readonly paletteGroups: PaletteGroup[] = [
        {
            id: 'participantes', title: 'Participantes', collapsed: false,
            items: [
                { kind: 'actor', label: 'Actor', hint: 'Persona o rol externo', iconType: 'svg' },
                { kind: 'objeto', label: 'Objeto', hint: 'Instancia de clase', iconType: 'svg' },
                { kind: 'sistema', label: 'Sistema', hint: 'Subsistema o módulo', iconType: 'svg' },
                { kind: 'basedatos', label: 'Base de datos', hint: 'Almacén persistente', iconType: 'svg' },
            ],
        },
        {
            id: 'mensajes', title: 'Mensajes', collapsed: false,
            items: [
                { kind: 'msg-sincrono', label: 'Síncrono', hint: 'Llamada que espera respuesta', iconType: 'svg' },
                { kind: 'msg-asincrono', label: 'Asíncrono', hint: 'Llamada sin esperar respuesta', iconType: 'svg' },
                { kind: 'msg-retorno', label: 'Retorno', hint: 'Respuesta a llamada previa', iconType: 'svg' },
                { kind: 'msg-creacion', label: 'Creación', hint: 'Instancia un nuevo objeto', iconType: 'svg' },
                { kind: 'msg-destruccion', label: 'Destrucción', hint: 'Termina la vida del objeto', iconType: 'svg' },
                { kind: 'msg-autoreferencia', label: 'Auto-ref.', hint: 'Llamada a sí mismo', iconType: 'svg' },
            ],
        },
        {
            id: 'fragmentos', title: 'Fragmentos', collapsed: false,
            items: [
                { kind: 'frag-alt', label: 'ALT', hint: 'Alternativa condicional', iconType: 'badge', icon: 'alt' },
                { kind: 'frag-loop', label: 'LOOP', hint: 'Bucle repetitivo', iconType: 'badge', icon: 'loop' },
                { kind: 'frag-opt', label: 'OPT', hint: 'Opcional si condición', iconType: 'badge', icon: 'opt' },
                { kind: 'frag-par', label: 'PAR', hint: 'Ejecución en paralelo', iconType: 'badge', icon: 'par' },
            ],
        },
    ];

    constructor(private diagramaApiService: DiagramaApiService) { }

    ngOnInit(): void { this.loadFromDiagram(); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['diagram'] && this.diagram) { this.loadFromDiagram(); }
    }

    ngAfterViewChecked(): void {
        if (this.needsSizeUpdate) {
            this.needsSizeUpdate = false;
            this.scheduleStageSizeUpdate();
        }
    }

    ngOnDestroy(): void {
        this.removeDragListeners();
        this.removeFragListeners();
        this.removeResizeListeners();
        window.removeEventListener('mousemove', this._onPanMouseMove);
        window.removeEventListener('mouseup', this._onPanMouseUp);
    }

    /* ── Accordion ── */
    toggleGroup(id: string): void {
        this.collapsedGroups.has(id) ? this.collapsedGroups.delete(id) : this.collapsedGroups.add(id);
    }
    isGroupCollapsed(id: string): boolean { return this.collapsedGroups.has(id); }

    /* ── Acciones canvas ── */
    guardarLienzo(): void { this.requestSave(); }
    clearCanvas(): void { this.requestClear(); }
    cancelMessage(): void { this.pendingMessage = null; this.ghostLine = null; }

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

        /* mensajes → modo conexión */
        if (MESSAGE_KINDS.has(kind)) {
            this.pendingMessage = { kind };
            return;
        }

        /* fragmentos → soltar en posición del canvas (con zoom/pan) */
        if (FRAGMENT_KINDS.has(kind)) {
            const pos = this.viewportToCanvas(event.clientX, event.clientY);
            const x = Math.max(8, pos.x - 80);
            const y = Math.max(8, pos.y - 40);
            const frag: SeqFragment = {
                id: this.buildId(), kind, label: this.fragLabel(kind),
                condition: 'condición', x, y, width: 220, height: 100,
            };
            this.fragments = [...this.fragments, frag];
            this.needsSizeUpdate = true;
            this.persistAll();
            return;
        }

        /* participantes */
        const pos = this.viewportToCanvas(event.clientX, event.clientY);
        const nextX = this.nextLifelineX();
        const x = Math.max(20, nextX);
        const y = 16;

        const node: SeqNode = {
            id: this.buildId(), kind,
            label: this.buildNodeLabel(kind, label),
            x, y,
        };
        this.canvasNodes = [...this.canvasNodes, node];
        this.needsSizeUpdate = true;
        this.persistAll();
    }

    /* ── Stage click: modo conexión ── */
    onStageClick(event: MouseEvent): void {
        if (!this.pendingMessage) return;

        const targetEl = event.target as Element;
        const msgEl = targetEl.closest('[data-msg-id]');
        const nodeEl = targetEl.closest('[data-node-id]');

        let clickedId: string | null = null;
        if (msgEl) clickedId = msgEl.getAttribute('data-msg-id');
        else if (nodeEl) clickedId = nodeEl.getAttribute('data-node-id');

        if (!clickedId) { this.cancelMessage(); return; }
        this.handleMessageClick(clickedId);
    }

    onNodeConnect(nodeId: string, event: MouseEvent): void {
        if (!this.pendingMessage) return;
        event.stopPropagation();
        this.handleMessageClick(nodeId);
    }

    private handleMessageClick(clickedId: string): void {
        if (!this.pendingMessage) return;

        if (!this.pendingMessage.sourceId) {
            this.pendingMessage = { ...this.pendingMessage, sourceId: clickedId };
            return;
        }

        if (clickedId === this.pendingMessage.sourceId) return;

        const sourceIsMsg = this.messages.some(m => m.id === this.pendingMessage!.sourceId);
        const targetIsMsg = this.messages.some(m => m.id === clickedId);

        let sourceId = this.pendingMessage.sourceId!;
        let targetId = clickedId;

        if (sourceIsMsg) {
            const ref = this.messages.find(m => m.id === sourceId);
            sourceId = ref ? ref.sourceId : sourceId;
        }
        if (targetIsMsg) {
            const ref = this.messages.find(m => m.id === targetId);
            targetId = ref ? ref.targetId : targetId;
        }

        const order = this.messages.length > 0
            ? Math.max(...this.messages.map(m => m.order)) + 1
            : 0;
        const msg: SeqMessage = {
            id: this.buildId(),
            kind: this.pendingMessage.kind,
            sourceId, targetId,
            label: this.buildMsgLabel(this.pendingMessage.kind),
            order,
        };
        this.messages = [...this.messages, msg];
        this.pendingMessage = null;
        this.ghostLine = null;
        this.persistAll();
    }

    /* ── Stage mousemove: ghost line ── */
    onStageMouseMove(event: MouseEvent): void {
        if (!this.pendingMessage?.sourceId) { this.ghostLine = null; return; }
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const srcPt = this.resolveCenter(this.pendingMessage.sourceId);
        if (!srcPt) return;
        this.ghostLine = {
            x1: srcPt.x, y1: srcPt.y,
            x2: (event.clientX - rect.left) / this.zoom,
            y2: (event.clientY - rect.top) / this.zoom,
        };
    }

    /* ── Clic en el punto medio de un mensaje ── */
    onMsgMidpointClick(msgId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (!this.pendingMessage) return;

        if (!this.pendingMessage.sourceId) {
            this.pendingMessage = { ...this.pendingMessage, sourceId: msgId };
        } else {
            if (msgId === this.pendingMessage.sourceId) return;

            const sourceIsMsg = this.messages.some(m => m.id === this.pendingMessage!.sourceId);
            let sourceId = this.pendingMessage.sourceId!;
            let targetId = msgId;

            if (sourceIsMsg) {
                const ref = this.messages.find(m => m.id === sourceId);
                sourceId = ref ? ref.sourceId : sourceId;
            }
            const refTarget = this.messages.find(m => m.id === targetId);
            targetId = refTarget ? refTarget.targetId : targetId;

            const order = this.messages.length > 0
                ? Math.max(...this.messages.map(m => m.order)) + 1
                : 0;
            const newMsg: SeqMessage = {
                id: this.buildId(),
                kind: this.pendingMessage.kind,
                sourceId, targetId,
                label: this.buildMsgLabel(this.pendingMessage.kind),
                order,
            };
            this.messages = [...this.messages, newMsg];
            this.pendingMessage = null;
            this.ghostLine = null;
            this.persistAll();
        }
    }

    /* ── Edición inline nodos ── */
    onNameBlur(event: FocusEvent, nodeId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.canvasNodes = this.canvasNodes.map(n =>
            n.id === nodeId ? { ...n, label: text || n.label } : n
        );
        this.persistAll();
    }

    blurTarget(event: Event): void {
        (event.target as HTMLElement).blur();
        event.preventDefault();
    }

    /* ── Edición inline mensajes ── */
    startEditMsg(msgId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.editingMsgId = msgId;
    }

    onMsgLabelBlur(event: FocusEvent, msgId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.messages = this.messages.map(m =>
            m.id === msgId ? { ...m, label: text || m.label } : m
        );
        this.editingMsgId = null;
        this.persistAll();
    }

    onMsgLabelKeydown(event: KeyboardEvent, msgId: string): void {
        if (event.key === 'Enter') { (event.target as HTMLElement).blur(); event.preventDefault(); }
        if (event.key === 'Escape') { this.editingMsgId = null; }
    }

    /* ── Reordenar mensajes ── */
    moveMsgUp(msgId: string): void {
        const idx = this.messages.findIndex(m => m.id === msgId);
        if (idx <= 0) return;
        const arr = [...this.messages];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        this.messages = arr.map((m, i) => ({ ...m, order: i }));
        this.persistAll();
    }

    moveMsgDown(msgId: string): void {
        const idx = this.messages.findIndex(m => m.id === msgId);
        if (idx < 0 || idx >= this.messages.length - 1) return;
        const arr = [...this.messages];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        this.messages = arr.map((m, i) => ({ ...m, order: i }));
        this.persistAll();
    }

    removeMessage(msgId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.messages = this.messages.filter(m => m.id !== msgId);
        this.persistAll();
    }

    /* ── Drag participantes ── */
    onNodePointerDown(event: PointerEvent, nodeId: string): void {
        if (this.pendingMessage) return;
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find(n => n.id === nodeId);
        if (!stage || !node) return;
        const rect = stage.getBoundingClientRect();
        this.draggingNodeId = nodeId;
        this.dragOffsetX = (event.clientX - rect.left) / this.zoom - node.x;
        this.hasPendingNodeMove = false;
        window.addEventListener('pointermove', this.onWindowPointerMove);
        window.addEventListener('pointerup', this.onWindowPointerUp);
        event.preventDefault();
    }

    removeNode(nodeId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.canvasNodes = this.canvasNodes.filter(n => n.id !== nodeId);
        this.messages = this.messages.filter(m => m.sourceId !== nodeId && m.targetId !== nodeId);
        this.persistAll();
    }

    /* ── Drag fragmentos ── */
    onFragPointerDown(event: PointerEvent, fragId: string): void {
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const frag = this.fragments.find(f => f.id === fragId);
        if (!stage || !frag) return;
        const rect = stage.getBoundingClientRect();
        this.draggingFragId = fragId;
        this.fragDragOffX = (event.clientX - rect.left) / this.zoom - frag.x;
        this.fragDragOffY = (event.clientY - rect.top) / this.zoom - frag.y;
        window.addEventListener('pointermove', this.onFragPointerMove);
        window.addEventListener('pointerup', this.onFragPointerUp);
        event.preventDefault();
        event.stopPropagation();
    }

    onFragResizeDown(event: PointerEvent, fragId: string): void {
        if (event.button !== 0) return;
        const stage = this.canvasStageRef?.nativeElement;
        const frag = this.fragments.find(f => f.id === fragId);
        if (!stage || !frag) return;
        const rect = stage.getBoundingClientRect();
        this.resizingFragId = fragId;
        this.resizeStartX = (event.clientX - rect.left) / this.zoom;
        this.resizeStartY = (event.clientY - rect.top) / this.zoom;
        this.resizeStartW = frag.width;
        this.resizeStartH = frag.height;
        window.addEventListener('pointermove', this.onFragResizeMove);
        window.addEventListener('pointerup', this.onFragResizeUp);
        event.preventDefault();
        event.stopPropagation();
    }

    removeFragment(fragId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.fragments = this.fragments.filter(f => f.id !== fragId);
        this.persistAll();
    }

    onFragConditionBlur(event: FocusEvent, fragId: string): void {
        const text = (event.target as HTMLElement).textContent?.trim() ?? '';
        this.fragments = this.fragments.map(f =>
            f.id === fragId ? { ...f, condition: text || f.condition } : f
        );
        this.persistAll();
    }

    /* ── SVG helpers ── */
    lifelineX(node: SeqNode): number {
        return node.x + NODE_DEFAULT_W / 2;
    }

    lifelineTop(node: SeqNode): number {
        return node.y + LIFELINE_HEAD_H;
    }

    lifelineBottom(): number {
        return this.stageSize.h - 20;
    }

    msgY(msg: SeqMessage): number {
        const idx = this.messages.findIndex(m => m.id === msg.id);
        return MSG_Y_START + (idx >= 0 ? idx : msg.order) * MSG_Y_GAP;
    }

    getMsgLine(msg: SeqMessage): { x1: number; y1: number; x2: number; y2: number } | null {
        const src = this.canvasNodes.find(n => n.id === msg.sourceId);
        const tgt = this.canvasNodes.find(n => n.id === msg.targetId);
        if (!src || !tgt) return null;
        const y = this.msgY(msg);
        return { x1: this.lifelineX(src), y1: y, x2: this.lifelineX(tgt), y2: y };
    }

    isSelfMsg(msg: SeqMessage): boolean {
        return msg.sourceId === msg.targetId;
    }

    selfMsgPath(msg: SeqMessage): string {
        const src = this.canvasNodes.find(n => n.id === msg.sourceId);
        if (!src) return '';
        const x = this.lifelineX(src);
        const y = this.msgY(msg);
        const offset = 40;
        return `M ${x} ${y} C ${x + offset} ${y}, ${x + offset} ${y + 30}, ${x} ${y + 30}`;
    }

    resolveCenter(id: string): { x: number; y: number } | null {
        const node = this.canvasNodes.find(n => n.id === id);
        if (node) return { x: this.lifelineX(node), y: this.lifelineTop(node) + 20 };
        return this.getMsgCenter(id);
    }

    getMsgCenter(msgId: string): { x: number; y: number } | null {
        const msg = this.messages.find(m => m.id === msgId);
        if (!msg) return null;
        const line = this.getMsgLine(msg);
        if (!line) return null;
        return { x: (line.x1 + line.x2) / 2, y: line.y1 };
    }

    getActivations(node: SeqNode): Array<{ y: number; h: number }> {
        const results: Array<{ y: number; h: number }> = [];
        let start: number | null = null;

        this.messages.forEach((msg, i) => {
            const y = MSG_Y_START + i * MSG_Y_GAP;
            const isTarget = msg.targetId === node.id && !this.isSelfMsg(msg);
            if (isTarget && start === null) start = y - 5;
            if (!isTarget && start !== null) {
                results.push({ y: start, h: y - start });
                start = null;
            }
        });
        if (start !== null) {
            results.push({ y: start, h: this.lifelineBottom() - start - 20 });
        }
        return results;
    }

    msgColor(kind: string): string {
        const map: Record<string, string> = {
            'msg-sincrono': '#fbbf24',
            'msg-asincrono': '#34d399',
            'msg-retorno': '#94a3b8',
            'msg-creacion': '#6ee7b7',
            'msg-destruccion': '#f87171',
            'msg-autoreferencia': '#a78bfa',
        };
        return map[kind] ?? '#94a3b8';
    }

    msgDash(kind: string): string {
        return kind === 'msg-retorno' ? '8,4' : 'none';
    }

    msgMarkerEnd(kind: string): string {
        if (kind === 'msg-destruccion') return '';
        if (kind === 'msg-retorno' || kind === 'msg-asincrono') return `url(#seq-open-${kind})`;
        return `url(#seq-arrow-${kind})`;
    }

    fragColor(kind: string): string {
        const map: Record<string, string> = {
            'frag-alt': '#818cf8',
            'frag-loop': '#34d399',
            'frag-opt': '#fbbf24',
            'frag-par': '#fb923c',
        };
        return map[kind] ?? '#94a3b8';
    }

    fragLabel(kind: string): string {
        return kind.replace('frag-', '').toUpperCase();
    }

    get msgMarkerDefs(): Array<{ id: string; type: 'arrow' | 'open'; color: string }> {
        return [
            { id: 'seq-arrow-msg-sincrono', type: 'arrow', color: this.msgColor('msg-sincrono') },
            { id: 'seq-arrow-msg-creacion', type: 'arrow', color: this.msgColor('msg-creacion') },
            { id: 'seq-arrow-msg-autoreferencia', type: 'arrow', color: this.msgColor('msg-autoreferencia') },
            { id: 'seq-open-msg-asincrono', type: 'open', color: this.msgColor('msg-asincrono') },
            { id: 'seq-open-msg-retorno', type: 'open', color: this.msgColor('msg-retorno') },
        ];
    }

    /* ── trackBy ── */
    trackByNode(_: number, n: SeqNode): string { return n.id; }
    trackByMsg(_: number, m: SeqMessage): string { return m.id; }
    trackByFrag(_: number, f: SeqFragment): string { return f.id; }
    trackByMarkerId(_: number, m: { id: string }): string { return m.id; }
    trackByGroup(_: number, g: PaletteGroup): string { return g.id; }
    trackByItem(_: number, i: PaletteItem): string { return i.kind; }

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
        this.canvasNodes = ((raw.nodes ?? []) as SeqNode[]).map(n => ({ ...n }));
        this.messages = ((raw.messages ?? []) as SeqMessage[]).slice().sort((a, b) => a.order - b.order);
        this.fragments = ((raw.fragments ?? []) as SeqFragment[]).map(f => ({ ...f }));
        this.pendingMessage = null;
        this.ghostLine = null;
        this.editingMsgId = null;
        this.needsSizeUpdate = true;
        if (this.canvasNodes.length === 0) {
            this.canvasNodes = this.buildStarterNodes();
            this.messages = this.buildStarterMessages();
            this.persistAll();
        }
    }

    private requestSave(): void {
        this.pendingAction = 'save';
        this.confirmModalConfig = {
            title: '¿Guardar cambios?',
            message: 'Se actualizará el diagrama actual con los cambios del canvas.',
            confirmText: 'Guardar', cancelText: 'Cancelar', type: 'info', icon: 'info'
        };
        this.showConfirmModal = true;
    }

    private requestClear(): void {
        if (this.canvasNodes.length === 0 && this.messages.length === 0 && this.fragments.length === 0) return;
        this.pendingAction = 'clear';
        this.confirmModalConfig = {
            title: '¿Limpiar diagrama?',
            message: 'Se eliminarán todos los participantes, mensajes y fragmentos. Esta acción no se puede deshacer.',
            confirmText: 'Limpiar', cancelText: 'Cancelar', type: 'danger', icon: 'trash'
        };
        this.showConfirmModal = true;
    }

    onConfirmModal(): void {
        if (this.pendingAction === 'save') this.persistAll();
        else if (this.pendingAction === 'clear') this.clearCanvasInternal();
        this.closeConfirm();
    }

    onCancelModal(): void { this.closeConfirm(); }

    private closeConfirm(): void {
        this.showConfirmModal = false;
        this.pendingAction = null;
    }

    private clearCanvasInternal(): void {
        this.canvasNodes = [];
        this.messages = [];
        this.fragments = [];
        this.pendingMessage = null;
        this.ghostLine = null;
        this.persistAll();
    }

    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const x = Math.max(12, (event.clientX - rect.left) / this.zoom - this.dragOffsetX);
        this.canvasNodes = this.canvasNodes.map(n =>
            n.id !== this.draggingNodeId ? n : { ...n, x }
        );
        this.hasPendingNodeMove = true;
    };

    private readonly onWindowPointerUp = (): void => {
        if (!this.draggingNodeId) { this.removeDragListeners(); return; }
        this.draggingNodeId = null;
        this.removeDragListeners();
        if (this.hasPendingNodeMove) { this.persistAll(); this.hasPendingNodeMove = false; }
    };

    private readonly onFragPointerMove = (event: PointerEvent): void => {
        if (!this.draggingFragId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const x = Math.max(8, (event.clientX - rect.left) / this.zoom - this.fragDragOffX);
        const y = Math.max(8, (event.clientY - rect.top) / this.zoom - this.fragDragOffY);
        this.fragments = this.fragments.map(f =>
            f.id !== this.draggingFragId ? f : { ...f, x, y }
        );
    };

    private readonly onFragPointerUp = (): void => {
        if (!this.draggingFragId) { this.removeFragListeners(); return; }
        this.draggingFragId = null;
        this.removeFragListeners();
        this.persistAll();
    };

    private readonly onFragResizeMove = (event: PointerEvent): void => {
        if (!this.resizingFragId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const dx = (event.clientX - rect.left) / this.zoom - this.resizeStartX;
        const dy = (event.clientY - rect.top) / this.zoom - this.resizeStartY;
        const newW = Math.max(120, this.resizeStartW + dx);
        const newH = Math.max(60, this.resizeStartH + dy);
        this.fragments = this.fragments.map(f =>
            f.id !== this.resizingFragId ? f : { ...f, width: newW, height: newH }
        );
    };

    private readonly onFragResizeUp = (): void => {
        if (!this.resizingFragId) { this.removeResizeListeners(); return; }
        this.resizingFragId = null;
        this.removeResizeListeners();
        this.persistAll();
    };

    private buildStarterNodes(): SeqNode[] {
        return [
            { id: this.buildId(), kind: 'actor', label: 'Usuario', x: LIFELINE_START_X, y: 16 },
            { id: this.buildId(), kind: 'objeto', label: 'Servicio', x: LIFELINE_START_X + LIFELINE_X_GAP, y: 16 },
            { id: this.buildId(), kind: 'basedatos', label: 'Base de datos', x: LIFELINE_START_X + LIFELINE_X_GAP * 2, y: 16 },
        ];
    }

    private buildStarterMessages(): SeqMessage[] {
        if (this.canvasNodes.length < 2) return [];
        const [a, b, c] = this.canvasNodes;
        return [
            { id: this.buildId(), kind: 'msg-sincrono', sourceId: a.id, targetId: b.id, label: 'solicitar()', order: 0 },
            { id: this.buildId(), kind: 'msg-sincrono', sourceId: b.id, targetId: c.id, label: 'consultar()', order: 1 },
            { id: this.buildId(), kind: 'msg-retorno', sourceId: c.id, targetId: b.id, label: 'datos', order: 2 },
            { id: this.buildId(), kind: 'msg-retorno', sourceId: b.id, targetId: a.id, label: 'respuesta', order: 3 },
        ];
    }

    private buildNodeLabel(kind: string, base: string): string {
        const count = this.canvasNodes.filter(n => n.kind === kind).length + 1;
        return `${base} ${count}`;
    }

    private buildMsgLabel(kind: string): string {
        const map: Record<string, string> = {
            'msg-sincrono': 'mensaje()',
            'msg-asincrono': 'señal()',
            'msg-retorno': 'retorno',
            'msg-creacion': '«create»',
            'msg-destruccion': '«destroy»',
            'msg-autoreferencia': 'proceso()',
        };
        return map[kind] ?? 'mensaje';
    }

    private nextLifelineX(): number {
        if (this.canvasNodes.length === 0) return LIFELINE_START_X;
        return Math.max(...this.canvasNodes.map(n => n.x)) + LIFELINE_X_GAP;
    }

    private persistAll(): void {
        if (!this.diagram) return;
        const payload = {
            nodes: this.canvasNodes.map(n => ({ ...n })),
            messages: this.messages,
            fragments: this.fragments,
        } as any;
        this.diagramaApiService.update(this.diagram.id, payload).subscribe({
            next: updated => this.diagramUpdated.emit(updated),
            error: (err: unknown) => console.error('Error al guardar canvas:', err),
        });
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

    private clamp(v: number, min: number, max: number): number {
        return max <= min ? min : Math.min(Math.max(v, min), max);
    }

    private buildId(): string {
        return typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `id-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private removeDragListeners(): void {
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }

    private removeFragListeners(): void {
        window.removeEventListener('pointermove', this.onFragPointerMove);
        window.removeEventListener('pointerup', this.onFragPointerUp);
    }

    private removeResizeListeners(): void {
        window.removeEventListener('pointermove', this.onFragResizeMove);
        window.removeEventListener('pointerup', this.onFragResizeUp);
    }
}