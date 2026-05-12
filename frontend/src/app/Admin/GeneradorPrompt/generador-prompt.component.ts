import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import {
  PromptGeneratorService,
  PromptConfig,
  ProjectData,
  PromptSection,
} from '../../services/prompt-generator.service';

type ViewMode = 'config' | 'preview' | 'design' | 'database';
type StackKind = 'frontend' | 'backend' | 'database' | 'arquitectura';

@Component({
  selector: 'app-generador-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent],
  templateUrl: './generador-prompt.component.html',
  styleUrls: ['./generador-prompt.component.css'],
})
export class GeneradorPromptComponent implements OnInit {
  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
  activeTab = 'generar-prompt';
  viewMode: ViewMode = 'config';

  config!: PromptConfig;
  projectData: ProjectData | null = null;
  promptOutput = '';
  designPromptOutput = '';
  dbPromptOutput = '';
  loading = false;
  dataLoaded = false;
  copied = false;
  copiedDesign = false;
  copiedDb = false;
  generating = false;

  /** Contadores de datos cargados */
  dataCounts: Record<string, number> = {};

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  readonly STACKS_FRONTEND = [
    'Angular', 'React', 'Vue.js', 'Next.js', 'Svelte', 'HTML/CSS/JS vanilla',
  ];
  readonly STACKS_BACKEND = [
    'NestJS (Node.js)', 'Express (Node.js)', 'Spring Boot (Java)',
    'Django (Python)', 'FastAPI (Python)', 'Laravel (PHP)', 'ASP.NET Core (C#)',
  ];
  readonly STACKS_DATABASE = [
    'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'SQL Server', 'Firebase / Firestore',
  ];
  readonly ARQUITECTURAS = [
    'Monolito modular', 'Microservicios', 'MVC tradicional',
    'Clean Architecture', 'Layered (N-tier)',
  ];

  readonly ALCANCES_PREDEFINIDOS = [
    {
      label: 'Código fuente completo (frontend + backend + BD)',
      value: 'Genera el código fuente completo del sistema incluyendo frontend, backend y scripts de base de datos. Incluye estructura de carpetas, módulos, componentes, servicios, controladores, entidades, migraciones y configuración del entorno. El código debe ser funcional y listo para ejecutarse en desarrollo.',
    },
    {
      label: 'Solo frontend (UI + lógica de vistas)',
      value: 'Genera únicamente el frontend de la aplicación: componentes de interfaz, rutas, servicios HTTP para consumir la API, manejo de estado y estilos. No generes backend ni base de datos.',
    },
    {
      label: 'Solo backend (API REST + lógica de negocio)',
      value: 'Genera únicamente el backend de la aplicación: módulos, controladores, servicios, DTOs, entidades y configuración de la API REST. No generes frontend ni scripts de base de datos.',
    },
    {
      label: 'Solo base de datos (esquema + migraciones)',
      value: 'Genera únicamente el esquema de base de datos: tablas/colecciones, relaciones, índices, restricciones, migraciones y datos semilla (seeds). No generes frontend ni backend.',
    },
    {
      label: 'Arquitectura y estructura del proyecto',
      value: 'Genera la estructura completa del proyecto con carpetas, archivos base, configuración de dependencias, variables de entorno y guía de arquitectura. No es necesario implementar lógica de negocio, solo la estructura base lista para desarrollar.',
    },
    {
      label: 'Prototipo funcional (MVP)',
      value: 'Genera un prototipo funcional (MVP) con las funcionalidades más importantes del sistema. Prioriza las historias de usuario de mayor impacto. El código debe ser funcional pero puede omitir optimizaciones y casos borde.',
    },
    {
      label: 'Módulo de autenticación y autorización',
      value: 'Genera el módulo completo de autenticación y autorización: registro, login, JWT/sesiones, roles y permisos, guards/middleware de protección de rutas, y recuperación de contraseña.',
    },
    {
      label: 'CRUD completo por cada entidad del sistema',
      value: 'Genera el CRUD completo para cada entidad identificada en el análisis: formularios de creación/edición, listados con filtros y paginación, confirmación de eliminación, y endpoints correspondientes en el backend.',
    },
  ];

  alcanceSelection = '';

  readonly UI_FRAMEWORKS = [
    'Tailwind CSS', 'Angular Material', 'PrimeNG', 'Bootstrap 5',
    'Chakra UI', 'shadcn/ui', 'Vuetify', 'DaisyUI',
  ];
  readonly DESIGN_STYLES = [
    'Minimal & Clean', 'Corporate / Enterprise', 'Dashboard / Admin Panel',
    'Material Design', 'Dark Mode First', 'Glassmorphism',
  ];
  readonly LAYOUT_TYPES = [
    'Sidebar + Contenido Principal', 'Header + Contenido (Horizontal Nav)',
    'Dashboard con Widgets', 'Landing Page / Marketing',
  ];
  readonly COLOR_PALETTES = [
    { label: 'Rojo Empresarial (#ef4444)',   hex: '#ef4444' },
    { label: 'Rosa (#ec4899)',               hex: '#ec4899' },
    { label: 'Naranja Energ\u00e9tico (#f97316)', hex: '#f97316' },
    { label: '\u00c1mbar (#f59e0b)',               hex: '#f59e0b' },
    { label: 'Lima (#84cc16)',               hex: '#84cc16' },
    { label: 'Verde Esmeralda (#10b981)',    hex: '#10b981' },
    { label: 'Cian (#06b6d4)',               hex: '#06b6d4' },
    { label: 'Azul Cielo (#0ea5e9)',         hex: '#0ea5e9' },
    { label: 'Azul Corporativo (#3b82f6)',   hex: '#3b82f6' },
    { label: '\u00cdndigo (#6366f1)',             hex: '#6366f1' },
    { label: 'Violeta Premium (#8b5cf6)',    hex: '#8b5cf6' },
    { label: 'Gris / Neutro (#64748b)',      hex: '#64748b' },
  ];

  get selectedColorHex(): string {
    const found = this.COLOR_PALETTES.find(p => p.label === this.config.design.colorPrimary);
    return found ? found.hex : '#3b82f6';
  }

  readonly CUSTOM_OPTION = '__custom__';
  stackFrontendSelection = '';
  stackBackendSelection = '';
  stackDatabaseSelection = '';
  arquitecturaSelection = '';
  stackFrontendCustom = '';
  stackBackendCustom = '';
  stackDatabaseCustom = '';
  arquitecturaCustom = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private promptService: PromptGeneratorService,
  ) {}

  ngOnInit(): void {
    this.config = this.promptService.getDefaultConfig();
    this.initStackSelections();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.proyecto.id = id;
    this.loading = true;

    // Cargar info del proyecto
    this.proyectoApiService.getProyecto(id).subscribe({
      next: (p) => {
        this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
      },
      error: (err: unknown) => console.error('Error al cargar proyecto:', err),
    });

    // Cargar todos los datos del proyecto
    this.promptService.loadProjectData(id).subscribe({
      next: (data) => {
        this.projectData = data;
        this.dataLoaded = true;
        this.loading = false;
        this.updateDataCounts();
      },
      error: (err: unknown) => {
        console.error('Error al cargar datos del proyecto:', err);
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const color = this.COLORES_PROYECTO.find((c) => c.valor === this.proyecto.color);
    return color ? color.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if ((mode === 'preview' || mode === 'design' || mode === 'database') && this.projectData && !this.promptOutput) {
      this.generateAll();
    }
  }

  toggleSection(section: PromptSection): void {
    section.enabled = !section.enabled;
  }

  toggleAllSections(enabled: boolean): void {
    this.config.sections.forEach(s => s.enabled = enabled);
  }

  onAlcanceChange(value: string): void {
    if (value !== '__custom__') {
      this.config.alcance = value;
    }
  }

  onStackSelectionChange(kind: StackKind, value: string): void {
    if (value === this.CUSTOM_OPTION) {
      this.seedCustomValue(kind);
      this.applyStackValue(kind, this.getCustomValue(kind));
      return;
    }
    this.applyStackValue(kind, value);
  }

  get enabledCount(): number {
    return this.config.sections.filter(s => s.enabled).length;
  }

  regenerate(): void {
    this.promptOutput = '';
    this.designPromptOutput = '';
    this.dbPromptOutput = '';
    this.generateAll();
  }

  generateAll(): void {
    if (!this.projectData) return;
    this.generating = true;
    setTimeout(() => {
      this.promptOutput = this.promptService.generatePrompt(this.projectData!, this.config);
      this.designPromptOutput = this.promptService.generateDesignPrompt(this.projectData!, this.config);
      this.dbPromptOutput = this.promptService.generateDatabasePrompt(this.projectData!, this.config);
      this.generating = false;
    }, 400);
  }

  copyToClipboard(): void {
    if (!this.promptOutput) return;
    navigator.clipboard.writeText(this.promptOutput).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  copyDesignToClipboard(): void {
    if (!this.designPromptOutput) return;
    navigator.clipboard.writeText(this.designPromptOutput).then(() => {
      this.copiedDesign = true;
      setTimeout(() => this.copiedDesign = false, 2500);
    });
  }

  copyDbToClipboard(): void {
    if (!this.dbPromptOutput) return;
    navigator.clipboard.writeText(this.dbPromptOutput).then(() => {
      this.copiedDb = true;
      setTimeout(() => this.copiedDb = false, 2500);
    });
  }

  downloadAsMarkdown(): void {
    if (!this.promptOutput) return;
    const blob = new Blob([this.promptOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${this.proyecto.nombre.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadDesignAsMarkdown(): void {
    if (!this.designPromptOutput) return;
    const blob = new Blob([this.designPromptOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-diseno-${this.proyecto.nombre.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadDbAsMarkdown(): void {
    if (!this.dbPromptOutput) return;
    const blob = new Blob([this.dbPromptOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-bd-${this.proyecto.nombre.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  get promptLineCount(): number {
    return this.promptOutput ? this.promptOutput.split('\n').length : 0;
  }

  get promptCharCount(): number {
    return this.promptOutput ? this.promptOutput.length : 0;
  }

  get promptWordCount(): number {
    return this.promptOutput ? this.promptOutput.split(/\s+/).filter(w => w.length > 0).length : 0;
  }

  get designPromptLineCount(): number {
    return this.designPromptOutput ? this.designPromptOutput.split('\n').length : 0;
  }

  get designPromptCharCount(): number {
    return this.designPromptOutput ? this.designPromptOutput.length : 0;
  }

  get designPromptWordCount(): number {
    return this.designPromptOutput ? this.designPromptOutput.split(/\s+/).filter(w => w.length > 0).length : 0;
  }

  get dbPromptLineCount(): number {
    return this.dbPromptOutput ? this.dbPromptOutput.split('\n').length : 0;
  }

  get dbPromptCharCount(): number {
    return this.dbPromptOutput ? this.dbPromptOutput.length : 0;
  }

  get dbPromptWordCount(): number {
    return this.dbPromptOutput ? this.dbPromptOutput.split(/\s+/).filter(w => w.length > 0).length : 0;
  }

  trackBySection(_i: number, s: PromptSection): string {
    return s.id;
  }

  private updateDataCounts(): void {
    if (!this.projectData) return;
    this.dataCounts = {
      proyecto: 1,
      stakeholders: this.projectData.stakeholders.length,
      procesos: this.projectData.procesos.length,
      entrevistas: this.projectData.entrevistas.length,
      encuestas: this.projectData.encuestas.length,
      observaciones: this.projectData.observaciones.length,
      focusGroups: this.projectData.focusGroups.length,
      historias: this.projectData.historias.length,
      documentos: this.projectData.documentos.length,
      seguimientos: this.projectData.seguimientos.length,
      diagramas: this.projectData.diagramas.length,
    };
  }

  private initStackSelections(): void {
    this.stackFrontendSelection = this.resolveSelection(this.STACKS_FRONTEND, this.config.stackFrontend);
    this.stackBackendSelection = this.resolveSelection(this.STACKS_BACKEND, this.config.stackBackend);
    this.stackDatabaseSelection = this.resolveSelection(this.STACKS_DATABASE, this.config.stackDatabase);
    this.arquitecturaSelection = this.resolveSelection(this.ARQUITECTURAS, this.config.arquitectura);

    if (this.stackFrontendSelection === this.CUSTOM_OPTION) {
      this.stackFrontendCustom = this.config.stackFrontend;
    }
    if (this.stackBackendSelection === this.CUSTOM_OPTION) {
      this.stackBackendCustom = this.config.stackBackend;
    }
    if (this.stackDatabaseSelection === this.CUSTOM_OPTION) {
      this.stackDatabaseCustom = this.config.stackDatabase;
    }
    if (this.arquitecturaSelection === this.CUSTOM_OPTION) {
      this.arquitecturaCustom = this.config.arquitectura;
    }
  }

  private resolveSelection(options: string[], value: string): string {
    return options.includes(value) ? value : this.CUSTOM_OPTION;
  }

  private applyStackValue(kind: StackKind, value: string): void {
    if (kind === 'frontend') this.config.stackFrontend = value;
    if (kind === 'backend') this.config.stackBackend = value;
    if (kind === 'database') this.config.stackDatabase = value;
    if (kind === 'arquitectura') this.config.arquitectura = value;
  }

  private getCustomValue(kind: StackKind): string {
    if (kind === 'frontend') return this.stackFrontendCustom;
    if (kind === 'backend') return this.stackBackendCustom;
    if (kind === 'database') return this.stackDatabaseCustom;
    return this.arquitecturaCustom;
  }

  private seedCustomValue(kind: StackKind): void {
    if (kind === 'frontend' && !this.stackFrontendCustom) this.stackFrontendCustom = this.config.stackFrontend;
    if (kind === 'backend' && !this.stackBackendCustom) this.stackBackendCustom = this.config.stackBackend;
    if (kind === 'database' && !this.stackDatabaseCustom) this.stackDatabaseCustom = this.config.stackDatabase;
    if (kind === 'arquitectura' && !this.arquitecturaCustom) this.arquitecturaCustom = this.config.arquitectura;
  }
}
