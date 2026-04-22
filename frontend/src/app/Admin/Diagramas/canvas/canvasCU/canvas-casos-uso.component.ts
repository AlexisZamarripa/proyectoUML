import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CanvasNode, DiagramaApiService, UmlDiagram } from '../../../../services/diagrama-api.service';

export interface PaletteItem {
    kind: string;
    label: string;
    hint: string;
    icon: SafeHtml;
}

export interface PaletteSection {
    id: string;
    label: string;
    color: string;
    items: PaletteItem[];
}

/* ── SVG raw strings — 28×28 viewBox, stroke 2 ───────────────────────────── */
const RAW_ICONS: Record<string, string> = {

    actor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="14" cy="5.5" r="3"/>
      <line x1="14" y1="8.5"  x2="14"  y2="18"/>
      <line x1="7"  y1="12.5" x2="21"  y2="12.5"/>
      <line x1="14" y1="18"   x2="9"   y2="25"/>
      <line x1="14" y1="18"   x2="19"  y2="25"/>
    </svg>`,

    caso: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2">
      <ellipse cx="14" cy="14" rx="11" ry="6.5"/>
    </svg>`,

    sistema: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <rect x="2" y="2" width="24" height="24" rx="2"/>
      <line x1="2" y1="9" x2="26" y2="9"/>
      <circle cx="5.5" cy="5.6" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="9"   cy="5.6" r="1.2" fill="currentColor" stroke="none"/>
    </svg>`,

    asociacion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="2" y1="14" x2="26" y2="14"/>
    </svg>`,

    include: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="2" y1="17" x2="20" y2="17" stroke-dasharray="4.5 3"/>
      <polyline points="16,12 23,17 16,22" fill="none"/>
      <text x="2" y="11" font-size="7" fill="currentColor" stroke="none"
        font-family="monospace" font-style="italic" font-weight="700">&#171;inc&#187;</text>
    </svg>`,

    extend: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="2" y1="17" x2="20" y2="17" stroke-dasharray="4.5 3"/>
      <polyline points="16,12 23,17 16,22" fill="none"/>
      <text x="2" y="11" font-size="7" fill="currentColor" stroke="none"
        font-family="monospace" font-style="italic" font-weight="700">&#171;ext&#187;</text>
    </svg>`,

    generalizacion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="2" y1="14" x2="20" y2="14"/>
      <polygon points="20,9 27,14 20,19" fill="none" stroke="currentColor"/>
    </svg>`,

    nota: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 2h13l6 6v18H5z"/>
      <polyline points="18,2 18,8 24,8"/>
      <line x1="9" y1="14" x2="19" y2="14"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>`,

    agrupacion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 3">
      <rect x="2" y="2" width="24" height="24" rx="3"/>
    </svg>`,
};

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

    private readonly ACCORDION_KEY = 'uml_accordion_casos_uso';
    accordionOpen: Record<string, boolean> = { figuras: true };

    paletteSections: PaletteSection[] = [];

    constructor(
        private diagramaApiService: DiagramaApiService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.loadAccordionState();
        this.buildPaletteSections();

        if (this.diagram) {
            this.canvasNodes = this.diagram.nodes.map((n) => ({ ...n }));
            if (this.canvasNodes.length === 0) {
                this.canvasNodes = this.buildStarterNodes();
                this.persistCanvasNodes();
            }
        }
    }

    ngOnDestroy(): void {
        this.removeDragListeners();
    }

    // ─── Paleta ───────────────────────────────────────────────────────────────

    private s(kind: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(RAW_ICONS[kind] ?? RAW_ICONS['caso']);
    }

    private buildPaletteSections(): void {
        this.paletteSections = [
            {
                id: 'figuras', label: 'Figuras', color: '#10b981',
                items: [
                    { kind: 'actor', label: 'Actor', hint: 'Rol externo que interactúa', icon: this.s('actor') },
                    { kind: 'caso', label: 'Caso de uso', hint: 'Funcionalidad del sistema', icon: this.s('caso') },
                    { kind: 'sistema', label: 'Límite del sistema', hint: 'Frontera del sistema', icon: this.s('sistema') },
                ]
            },
            {
                id: 'relaciones', label: 'Relaciones', color: '#f59e0b',
                items: [
                    { kind: 'asociacion', label: 'Asociación', hint: 'Actor ↔ caso de uso', icon: this.s('asociacion') },
                    { kind: 'include', label: 'Include', hint: 'Relación «include»', icon: this.s('include') },
                    { kind: 'extend', label: 'Extend', hint: 'Relación «extend»', icon: this.s('extend') },
                    { kind: 'generalizacion', label: 'Generalización', hint: 'Herencia entre elementos', icon: this.s('generalizacion') },
                ]
            },
            {
                id: 'extras', label: 'Extras', color: '#94a3b8',
                items: [
                    { kind: 'nota', label: 'Nota', hint: 'Anotación libre', icon: this.s('nota') },
                    { kind: 'agrupacion', label: 'Agrupación', hint: 'Agrupa elementos', icon: this.s('agrupacion') },
                ]
            }
        ];
    }

    // ─── Acordeón ────────────────────────────────────────────────────────────

    toggleSection(sectionId: string): void {
        this.accordionOpen[sectionId] = !this.accordionOpen[sectionId];
        this.saveAccordionState();
    }

    isSectionOpen(sectionId: string): boolean {
        return !!this.accordionOpen[sectionId];
    }

    private loadAccordionState(): void {
        try {
            const stored = localStorage.getItem(this.ACCORDION_KEY);
            if (stored) { this.accordionOpen = JSON.parse(stored); }
        } catch { this.accordionOpen = { figuras: true }; }
    }

    private saveAccordionState(): void {
        try { localStorage.setItem(this.ACCORDION_KEY, JSON.stringify(this.accordionOpen)); } catch { /* no-op */ }
    }

    // ─── Canvas actions ───────────────────────────────────────────────────────

    guardarLienzo(): void { this.persistCanvasNodes(); }

    clearCanvas(): void {
        if (this.canvasNodes.length === 0) { return; }
        this.canvasNodes = [];
        this.persistCanvasNodes();
    }

    // ─── Icono para nodo en canvas ────────────────────────────────────────────

    getIconForKind(kind: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(RAW_ICONS[kind] ?? RAW_ICONS['caso']);
    }

    // ─── Drag desde paleta ────────────────────────────────────────────────────

    onPaletteDragStart(event: DragEvent, item: PaletteItem): void {
        if (!event.dataTransfer) { return; }
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/x-uml-kind', item.kind);
        event.dataTransfer.setData('application/x-uml-label', item.label);
    }

    onCanvasDragOver(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) { event.dataTransfer.dropEffect = 'copy'; }
    }

    onCanvasDrop(event: DragEvent): void {
        event.preventDefault();
        const kind = event.dataTransfer?.getData('application/x-uml-kind');
        const label = event.dataTransfer?.getData('application/x-uml-label');
        if (!kind || !label) { return; }
        const stage = event.currentTarget;
        if (!(stage instanceof HTMLElement)) { return; }

        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - 60, 12, rect.width - 160);
        const y = this.clamp(event.clientY - rect.top - 30, 12, rect.height - 90);

        const newNode: CanvasNode = {
            id: this.buildNodeId(),
            kind,
            label: this.buildNodeLabel(kind, label),
            x, y,
        };
        this.canvasNodes = [...this.canvasNodes, newNode];
        this.persistCanvasNodes();
    }

    // ─── Drag de nodos en canvas ──────────────────────────────────────────────

    startNodeDrag(event: PointerEvent, nodeId: string): void {
        if (event.button !== 0) { return; }
        const stage = this.canvasStageRef?.nativeElement;
        const node = this.canvasNodes.find((n) => n.id === nodeId);
        if (!stage || !node) { return; }

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
        this.canvasNodes = this.canvasNodes.filter((n) => n.id !== nodeId);
        this.persistCanvasNodes();
    }

    trackByNode(_i: number, n: CanvasNode): string { return n.id; }
    trackBySection(_i: number, s: PaletteSection): string { return s.id; }
    trackByPalette(_i: number, p: PaletteItem): string { return p.kind; }

    // ─── Window handlers ─────────────────────────────────────────────────────

    private readonly onWindowPointerMove = (event: PointerEvent): void => {
        if (!this.draggingNodeId) { return; }
        const stage = this.canvasStageRef?.nativeElement;
        if (!stage) { return; }
        const rect = stage.getBoundingClientRect();
        const x = this.clamp(event.clientX - rect.left - this.dragOffsetX, 12, rect.width - 160);
        const y = this.clamp(event.clientY - rect.top - this.dragOffsetY, 12, rect.height - 90);
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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private buildStarterNodes(): CanvasNode[] {
        return [
            { id: this.buildNodeId(), kind: 'actor', label: 'Actor 1', x: 56, y: 72 },
            { id: this.buildNodeId(), kind: 'caso', label: 'Caso de uso 1', x: 258, y: 80 },
            { id: this.buildNodeId(), kind: 'sistema', label: 'Sistema 1', x: 244, y: 220 },
        ];
    }

    private buildNodeLabel(kind: string, baseLabel: string): string {
        const count = this.canvasNodes.filter((n) => n.kind === kind).length + 1;
        return `${baseLabel} ${count}`;
    }

    private persistCanvasNodes(): void {
        if (!this.diagram) { return; }
        const nodes = this.canvasNodes.map((n) => ({ ...n }));
        this.diagramaApiService.update(this.diagram.id, { nodes }).subscribe({
            next: (updated) => { this.diagramUpdated.emit(updated); },
            error: (err: unknown) => console.error('Error al guardar canvas:', err),
        });
    }

    private clamp(v: number, mn: number, mx: number): number {
        return mx <= mn ? mn : Math.min(Math.max(v, mn), mx);
    }

    private buildNodeId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) { return crypto.randomUUID(); }
        return `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    private removeDragListeners(): void {
        if (typeof window === 'undefined') { return; }
        window.removeEventListener('pointermove', this.onWindowPointerMove);
        window.removeEventListener('pointerup', this.onWindowPointerUp);
    }
}