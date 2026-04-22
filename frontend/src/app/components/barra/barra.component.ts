import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-barra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barra.component.html',
  styleUrls: ['./barra.component.css']
})
export class BarraComponent implements OnInit, OnChanges {
  @Input() projectId = '';
  @Input() activeTab = '';

  topItems: NavItem[] = [];
  navSections: NavSection[] = [];

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.buildNavigation();
  }

  ngOnChanges(): void {
    this.buildNavigation();
  }

  navigate(route: string, event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    void this.router.navigateByUrl(route, {
      state: {
        preserveScroll: true,
        scrollY: window.scrollY,
      },
    });
  }

  private buildNavigation(): void {
    const base = `/proyecto/${this.projectId}`;

    this.topItems = [
      { id: 'stakeholders', label: 'Stakeholders', icon: 'users', route: `${base}/stakeholders` },
      { id: 'procesos', label: 'Procesos', icon: 'grid', route: `${base}/procesos` },
    ];

    this.navSections = [
      {
        id: 'analysis',
        label: 'ANÁLISIS',
        items: [
          { id: 'entrevistas', label: 'Entrevistas', icon: 'file', route: `${base}/entrevistas` },
          { id: 'encuestas', label: 'Encuestas', icon: 'clipboard', route: `${base}/encuestas` },
          { id: 'observaciones', label: 'Observaciones', icon: 'eye', route: `${base}/observaciones` },
          { id: 'focus-groups', label: 'Focus Groups', icon: 'users-group', route: `${base}/focus-groups` },
          { id: 'historias', label: 'Historias', icon: 'book', route: `${base}/historias` },
          { id: 'documentos', label: 'Documentos', icon: 'folder', route: `${base}/documentos` },
          { id: 'seguimiento', label: 'Seguimiento', icon: 'trending', route: `${base}/seguimiento` },
        ],
      },
      {
        id: 'visualization',
        label: 'VISUALIZACIÓN',
        items: [
          { id: 'diagramas', label: 'Diagramas', icon: 'diagram', route: `${base}/diagramas` },
        ],
      },
    ];
  }
}