import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface NavSection {
  id: string;
  label: string;
  collapsible: boolean;
  expanded: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-barra',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './barra.component.html',
  styleUrls: ['./barra.component.css']
})
export class BarraComponent implements OnInit, OnChanges {
  @Input() projectId = '';
  @Input() activeTab = '';

  topItems: NavItem[] = [];
  navSections: NavSection[] = [];

  ngOnInit(): void {
    this.buildNavigation();
  }

  ngOnChanges(): void {
    this.buildNavigation();
  }

  toggleSection(sectionId: string): void {
    const section = this.navSections.find((item) => item.id === sectionId);
    if (!section || !section.collapsible) {
      return;
    }
    section.expanded = !section.expanded;
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
        collapsible: true,
        expanded: false,
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
        collapsible: false,
        expanded: true,
        items: [
          { id: 'diagramas', label: 'Diagramas', icon: 'diagram', route: `${base}/diagramas` },
        ],
      },
    ];

    this.expandSectionWithActiveItem();
  }

  private expandSectionWithActiveItem(): void {
    for (const section of this.navSections) {
      if (section.collapsible && section.items.some((item) => item.id === this.activeTab)) {
        section.expanded = true;
      }
    }
  }
}