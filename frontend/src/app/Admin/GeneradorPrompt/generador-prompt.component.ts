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

type ViewMode = 'config' | 'preview';

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
  loading = false;
  dataLoaded = false;
  copied = false;
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
    'NestJS (Node.js)', 'Express (Node.js)', 'Spring Boot (Java)', 'Django (Python)',
    'Flask (Python)', 'FastAPI (Python)', 'Laravel (PHP)', 'ASP.NET Core (C#)', 'Ruby on Rails',
  ];
  readonly STACKS_DATABASE = [
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'SQL Server', 'Firebase',
  ];
  readonly ARQUITECTURAS = [
    'Monolito modular', 'Microservicios', 'Serverless', 'MVC tradicional', 'Hexagonal / Ports & Adapters',
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private promptService: PromptGeneratorService,
  ) {}

  ngOnInit(): void {
    this.config = this.promptService.getDefaultConfig();

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
    if (mode === 'preview' && this.projectData) {
      this.generatePrompt();
    }
  }

  toggleSection(section: PromptSection): void {
    section.enabled = !section.enabled;
  }

  toggleAllSections(enabled: boolean): void {
    this.config.sections.forEach(s => s.enabled = enabled);
  }

  get enabledCount(): number {
    return this.config.sections.filter(s => s.enabled).length;
  }

  generatePrompt(): void {
    if (!this.projectData) return;
    this.generating = true;

    // Pequeño timeout para mostrar animación
    setTimeout(() => {
      this.promptOutput = this.promptService.generatePrompt(this.projectData!, this.config);
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

  get promptLineCount(): number {
    return this.promptOutput ? this.promptOutput.split('\n').length : 0;
  }

  get promptCharCount(): number {
    return this.promptOutput ? this.promptOutput.length : 0;
  }

  get promptWordCount(): number {
    return this.promptOutput ? this.promptOutput.split(/\s+/).filter(w => w.length > 0).length : 0;
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
}
