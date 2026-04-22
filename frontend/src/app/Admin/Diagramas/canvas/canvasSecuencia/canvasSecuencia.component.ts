import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

export interface PaletteItem {
    kind: string;
    label: string;
    hint: string;
    iconType: 'svg' | 'badge' | 'text';
    icon?: string;   // sólo para badge/text
}

export interface PaletteGroup {
    title: string;
    collapsed: boolean;
    items: PaletteItem[];
}

@Component({
    selector: 'app-canvas-secuencia',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvasSecuencia.component.html',
    styleUrls: ['./canvasSecuencia.component.css']
})
export class CanvasSecuenciaComponent implements OnInit, OnDestroy {
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
            title: 'Participantes', collapsed: false,
            items: [
                { kind: 'actor', label: 'Actor', hint: 'Persona o rol externo', iconType: 'svg' },
                { kind: 'objeto', label: 'Objeto', hint: 'Instancia de clase', iconType: 'svg' },
                { kind: 'sistema', label: 'Sistema', hint: 'Subsistema o módulo', iconType: 'svg' },
                { kind: 'basedatos', label: 'Base de datos', hint: 'Almacén persistente', iconType: 'svg' },
            ],
        },
        {
            title: 'Elementos', collapsed: false,
            items: [
                { kind: 'lineadevida', label: 'Línea de vida', hint: 'Existencia temporal', iconType: 'svg' },
                { kind: 'activacion', label: 'Activación', hint: 'Bloque de ejecución', iconType: 'svg' },
            ],
        },
        {
            title: 'Mensajes', collapsed: false,
            items: [
                { kind: 'msg-sincrono', label: 'Mensaje síncrono', hint: 'Llamada que espera respuesta', iconType: 'svg' },
                { kind: 'msg-asincrono', label: 'Mensaje asíncrono', hint: 'Llamada sin esperar respuesta', iconType: 'svg' },
                { kind: 'msg-retorno', label: 'Mensaje de retorno', hint: 'Respuesta a llamada previa', iconType: 'svg' },
                { kind: 'msg-creacion', label: 'Mensaje de creación', hint: 'Instancia un nuevo objeto', iconType: 'svg' },
                { kind: 'msg-destruccion', label: 'Mensaje de destrucción', hint: 'Termina la vida del objeto', iconType: 'svg' },
            ],
        },
        {
            title: 'Fragmentos', collapsed: false,
            items: [
                { kind: 'frag-alt', label: 'Fragmento ALT', hint: 'Alternativa condicional', iconType: 'badge', icon: 'alt' },
                { kind: 'frag-loop', label: 'Fragmento LOOP', hint: 'Bucle repetitivo', iconType: 'badge', icon: 'loop' },
                { kind: 'frag-opt', label: 'Fragmento OPT', hint: 'Opcional si condición', iconType: 'badge', icon: 'opt' },
                { kind: 'frag-par', label: 'Fragmento PAR', hint: 'Ejecución en paralelo', iconType: 'badge', icon: 'par' },
            ],
        },
        {
            title: 'Extras', collapsed: false,
            items: [
                { kind: 'condicion', label: 'Condición / Guard', hint: 'Restricción sobre un flujo', iconType: 'text', icon: '[cond]' },
                { kind: 'nota', label: 'Nota / Comentario', hint: 'Anotación libre', iconType: 'svg' },
            ],
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

    ngOnDestroy(): void { this.removeDragListeners(); }

    toggleGroup(group: PaletteGroup): void {
        group.collapsed = !group.collapsed;
    }

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
            id: this.buildNodeId(), kind, label: this.buildNodeLabel(kind, label), x, y,
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

    trackByNode(_i: number, node: CanvasNode): string { return node.id; }
    trackByGroup(_i: number, g: PaletteGroup): string { return g.title; }
    trackByItem(_i: number, item: PaletteItem): string { return item.kind; }

    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) return;
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 148);
        const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 60);
        this.canvasNodes = this.canvasNodes.map((n) => n.id !== this.draggingNodeId ? n : { ...n, x, y });
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
            { id: this.buildNodeId(), kind: 'actor', label: 'Actor 1', x: 54, y: 66 },
            { id: this.buildNodeId(), kind: 'objeto', label: 'Objeto 1', x: 280, y: 66 },
            { id: this.buildNodeId(), kind: 'msg-sincrono', label: 'Mensaje 1', x: 168, y: 200 },
        ];
    }

    private buildNodeLabel(kind: string, baseLabel: string): string {
        const count = this.canvasNodes.filter((n) => n.kind === kind).length + 1;
        return `${baseLabel} ${count}`;
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