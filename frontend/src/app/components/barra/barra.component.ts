import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  section?: string;
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

  NAV_ITEMS: NavItem[] = [];

  ngOnInit(): void {
    this.NAV_ITEMS = this.buildNavItems(this.projectId);
  }

  ngOnChanges(): void {
    this.NAV_ITEMS = this.buildNavItems(this.projectId);
  }

  private buildNavItems(projectId: string): NavItem[] {
    const base = `/proyecto/${projectId}`;
    return [
      { id: 'stakeholders', label: 'Stakeholders', icon: 'users', route: `${base}/stakeholders` },
      { id: 'procesos', label: 'Procesos', icon: 'grid', route: `${base}/procesos` },
      { id: 'entrevistas', label: 'Entrevistas', icon: 'file', route: `${base}/entrevistas`, section: 'ANÁLISIS' },
      { id: 'encuestas', label: 'Encuestas', icon: 'clipboard', route: `${base}/encuestas` },
      { id: 'observaciones', label: 'Observaciones', icon: 'eye', route: `${base}/observaciones` },
      { id: 'focus-groups', label: 'Focus Groups', icon: 'users-group', route: `${base}/focus-groups` },
      { id: 'historias', label: 'Historias', icon: 'book', route: `${base}/historias` },
      { id: 'documentos', label: 'Documentos', icon: 'folder', route: `${base}/documentos` },
      { id: 'seguimiento', label: 'Seguimiento', icon: 'trending', route: `${base}/seguimiento` },
    ];
  }
}