import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ProyectoApiService, Proyecto } from './proyecto-api.service';
import { StakeholderApiService, Stakeholder } from './stakeholder-api.service';
import { ProcesoApiService, Proceso } from './proceso-api.service';
import { EntrevistaApiService, Entrevista } from './Entrevista-api.service';
import { EncuestaApiService, Encuesta } from './encuesta-api.service';
import { ObservacionApiService, Observacion } from './Observacion-api.service';
import { FocusGroupApiService, FocusGroup } from './FocusGroup.service';
import { HistoriaUsuarioApiService, HistoriaUsuario } from './HistoriasUsuario-api.service';
import { DocumentoApiService, AnalisisDocumento } from './documento-api.service';
import { SeguimientoApiService, SeguimientoResponse } from './seguimiento-api.service';
import { DiagramaApiService, UmlDiagram } from './diagrama-api.service';

export interface PromptSection {
  id: string;
  label: string;
  enabled: boolean;
  icon: string;
}

export interface PromptConfig {
  sections: PromptSection[];
  stackFrontend: string;
  stackBackend: string;
  stackDatabase: string;
  stackExtra: string;
  arquitectura: string;
  alcance: string;
}

export interface ProjectData {
  proyecto: Proyecto;
  stakeholders: Stakeholder[];
  procesos: Proceso[];
  entrevistas: Entrevista[];
  encuestas: Encuesta[];
  observaciones: Observacion[];
  focusGroups: FocusGroup[];
  historias: HistoriaUsuario[];
  documentos: AnalisisDocumento[];
  seguimientos: SeguimientoResponse[];
  diagramas: UmlDiagram[];
}

@Injectable({ providedIn: 'root' })
export class PromptGeneratorService {

  constructor(
    private proyectoApi: ProyectoApiService,
    private stakeholderApi: StakeholderApiService,
    private procesoApi: ProcesoApiService,
    private entrevistaApi: EntrevistaApiService,
    private encuestaApi: EncuestaApiService,
    private observacionApi: ObservacionApiService,
    private focusGroupApi: FocusGroupApiService,
    private historiaApi: HistoriaUsuarioApiService,
    private documentoApi: DocumentoApiService,
    private seguimientoApi: SeguimientoApiService,
    private diagramaApi: DiagramaApiService,
  ) { }

  getDefaultConfig(): PromptConfig {
    return {
      sections: [
        { id: 'proyecto', label: 'Información del Proyecto', enabled: true, icon: 'folder' },
        { id: 'stakeholders', label: 'Stakeholders', enabled: true, icon: 'users' },
        { id: 'procesos', label: 'Procesos de Negocio', enabled: true, icon: 'grid' },
        { id: 'entrevistas', label: 'Entrevistas', enabled: true, icon: 'file' },
        { id: 'encuestas', label: 'Encuestas', enabled: true, icon: 'clipboard' },
        { id: 'observaciones', label: 'Observaciones', enabled: true, icon: 'eye' },
        { id: 'focusGroups', label: 'Focus Groups', enabled: true, icon: 'users-group' },
        { id: 'historias', label: 'Historias de Usuario', enabled: true, icon: 'book' },
        { id: 'documentos', label: 'Documentos y Hallazgos', enabled: true, icon: 'folder' },
        { id: 'seguimientos', label: 'Seguimiento', enabled: true, icon: 'trending' },
        { id: 'diagramas', label: 'Diagramas UML', enabled: true, icon: 'diagram' },
      ],
      stackFrontend: 'Angular',
      stackBackend: 'NestJS (Node.js)',
      stackDatabase: 'MySQL',
      stackExtra: '',
      arquitectura: 'Monolito modular',
      alcance: 'Aplicación completa (frontend + backend + base de datos)',
    };
  }

  loadProjectData(proyectoId: string): Observable<ProjectData> {
    const id = Number(proyectoId);

    return forkJoin({
      proyecto: this.proyectoApi.getProyecto(proyectoId),
      stakeholders: this.stakeholderApi.getStakeholders(proyectoId).pipe(catchError(() => of([]))),
      procesos: this.procesoApi.getProcesosByProyecto(id).pipe(catchError(() => of([]))),
      entrevistas: this.entrevistaApi.getEntrevistas(id).pipe(catchError(() => of([]))),
      encuestas: this.encuestaApi.getEncuestas(id).pipe(catchError(() => of([]))),
      observaciones: this.observacionApi.getObservaciones(id).pipe(catchError(() => of([]))),
      focusGroups: this.focusGroupApi.getFocusGroups(id).pipe(catchError(() => of([]))),
      historias: this.historiaApi.getHistorias(id).pipe(catchError(() => of([]))),
      documentos: this.documentoApi.getByProyecto(id).pipe(catchError(() => of([]))),
      seguimientos: this.seguimientoApi.getByProyecto(id).pipe(catchError(() => of([]))),
      diagramas: this.diagramaApi.getByProyecto(id).pipe(catchError(() => of([]))),
    });
  }

  generatePrompt(data: ProjectData, config: PromptConfig): string {
    const parts: string[] = [];
    const enabled = (id: string) => config.sections.find(s => s.id === id)?.enabled ?? true;

    parts.push('# Solicitud de Desarrollo de Software\n');
    parts.push('A continuación se presenta toda la información recopilada durante el análisis de requerimientos de un proyecto de software. Utiliza esta información para generar el código fuente completo del sistema.\n');

    // 1. Proyecto
    if (enabled('proyecto')) {
      parts.push(this.buildProyectoSection(data.proyecto));
    }

    // 2. Stakeholders
    if (enabled('stakeholders') && data.stakeholders.length > 0) {
      parts.push(this.buildStakeholdersSection(data.stakeholders));
    }

    // 3. Procesos
    if (enabled('procesos') && data.procesos.length > 0) {
      parts.push(this.buildProcesosSection(data.procesos));
    }

    // 4. Entrevistas
    if (enabled('entrevistas') && data.entrevistas.length > 0) {
      parts.push(this.buildEntrevistasSection(data.entrevistas));
    }

    // 5. Encuestas
    if (enabled('encuestas') && data.encuestas.length > 0) {
      parts.push(this.buildEncuestasSection(data.encuestas));
    }

    // 6. Observaciones
    if (enabled('observaciones') && data.observaciones.length > 0) {
      parts.push(this.buildObservacionesSection(data.observaciones));
    }

    // 7. Focus Groups
    if (enabled('focusGroups') && data.focusGroups.length > 0) {
      parts.push(this.buildFocusGroupsSection(data.focusGroups));
    }

    // 8. Historias de Usuario
    if (enabled('historias') && data.historias.length > 0) {
      parts.push(this.buildHistoriasSection(data.historias));
    }

    // 9. Documentos
    if (enabled('documentos') && data.documentos.length > 0) {
      parts.push(this.buildDocumentosSection(data.documentos));
    }

    // 10. Seguimiento
    if (enabled('seguimientos') && data.seguimientos.length > 0) {
      parts.push(this.buildSeguimientoSection(data.seguimientos));
    }

    // 11. Diagramas UML
    if (enabled('diagramas') && data.diagramas.length > 0) {
      parts.push(this.buildDiagramasSection(data.diagramas));
    }

    // 12. Instrucciones de generación
    parts.push(this.buildInstruccionesSection(config));

    return parts.join('\n');
  }

  // ─────── Builders de secciones ───────

  private buildProyectoSection(p: Proyecto): string {
    return [
      '## 1. Información del Proyecto\n',
      `- **Nombre:** ${p.nombre}`,
      `- **Descripción:** ${p.descripcion}`,
      `- **Estado:** ${p.estado}`,
      `- **Fecha de inicio:** ${p.fechaInicio}`,
      '',
    ].join('\n');
  }

  private buildStakeholdersSection(list: Stakeholder[]): string {
    const rows = list.map(s =>
      `| ${s.nombre} | ${s.rol} | ${s.area} | ${s.contacto} | ${s.notas || '—'} |`
    );
    return [
      '## 2. Stakeholders\n',
      'Las siguientes personas participaron en el levantamiento de requerimientos:\n',
      '| Nombre | Rol | Área | Contacto | Notas |',
      '|--------|-----|------|----------|-------|',
      ...rows,
      '',
    ].join('\n');
  }

  private buildProcesosSection(list: Proceso[]): string {
    const items: string[] = [];
    list.forEach((p, i) => {
      items.push(`### Proceso ${i + 1}: ${p.nombre}\n`);
      items.push(`- **Descripción:** ${p.descripcion}`);
      if (p.departamentos?.length) {
        items.push(`- **Departamentos involucrados:** ${p.departamentos.join(', ')}`);
      }
      if (p.pasos_clave?.length) {
        items.push(`- **Pasos clave:** ${p.pasos_clave.join(' → ')}`);
      }
      if (p.subprocesos?.length) {
        items.push('\n**Subprocesos:**\n');
        p.subprocesos.forEach(sp => {
          items.push(`- **${sp.nombre}:** ${sp.descripcion}`);
          if (sp.herramienta) {
            items.push(`  - Herramienta: ${sp.herramienta.nombre} (${sp.herramienta.tipo})`);
          }
        });
      }
      items.push('');
    });
    return ['## 3. Procesos de Negocio\n', ...items].join('\n');
  }

  private buildEntrevistasSection(list: Entrevista[]): string {
    const items: string[] = [];
    list.forEach((e, i) => {
      items.push(`### Entrevista ${i + 1}: ${e.titulo_entrevista || 'Sin título'}\n`);
      items.push(`- **Entrevistador:** ${e.entrevistador || '—'}`);
      items.push(`- **Entrevistado:** ${e.entrevistado || '—'}`);
      if (e.notas_contexto) {
        items.push(`- **Contexto:** ${e.notas_contexto}`);
      }
      if (e.preguntas?.length) {
        items.push('\n**Preguntas y Respuestas:**\n');
        e.preguntas.forEach(q => {
          items.push(`> **P:** ${q.pregunta}`);
          items.push(`> **R:** ${q.respuesta || '(Sin respuesta)'}\n`);
        });
      }
      items.push('');
    });
    return ['## 4. Hallazgos de Entrevistas\n', ...items].join('\n');
  }

  private buildEncuestasSection(list: Encuesta[]): string {
    const items: string[] = [];
    list.forEach((enc, i) => {
      items.push(`### Encuesta ${i + 1}: ${enc.titulo_encuesta}\n`);
      items.push(`- **Descripción:** ${enc.descripcion}`);
      items.push(`- **Participantes esperados:** ${enc.numero_participantes_esperados}`);
      if (enc.preguntas?.length) {
        items.push('\n**Preguntas:**\n');
        enc.preguntas.forEach((q, j) => {
          items.push(`${j + 1}. (${q.tipo_pregunta}) ${q.pregunta}`);
        });
      }
      items.push('');
    });
    return ['## 5. Hallazgos de Encuestas\n', ...items].join('\n');
  }

  private buildObservacionesSection(list: Observacion[]): string {
    const items: string[] = [];
    list.forEach((o, i) => {
      items.push(`### Observación ${i + 1}: ${o.titulo}\n`);
      items.push(`- **Observaciones:** ${o.observaciones}`);
      if (o.hallazgos_puntos_clave) {
        items.push(`- **Hallazgos clave:** ${o.hallazgos_puntos_clave}`);
      }
      items.push('');
    });
    return ['## 6. Observaciones de Campo\n', ...items].join('\n');
  }

  private buildFocusGroupsSection(list: FocusGroup[]): string {
    const items: string[] = [];
    list.forEach((fg, i) => {
      items.push(`### Focus Group ${i + 1}: ${fg.nombre_focus}\n`);
      if (fg.descripcion) items.push(`- **Descripción:** ${fg.descripcion}`);
      if (fg.moderador) items.push(`- **Moderador:** ${fg.moderador}`);
      if (fg.modalidad) items.push(`- **Modalidad:** ${fg.modalidad}`);
      if (fg.lugar) items.push(`- **Lugar:** ${fg.lugar}`);
      if (fg.numero_participantes) items.push(`- **Participantes:** ${fg.numero_participantes}`);
      if (fg.conclusiones) items.push(`- **Conclusiones:** ${fg.conclusiones}`);
      items.push('');
    });
    return ['## 7. Focus Groups\n', ...items].join('\n');
  }

  private buildHistoriasSection(list: HistoriaUsuario[]): string {
    const items: string[] = [];
    list.forEach((h, i) => {
      items.push(`### Historia ${i + 1}: ${h.titulo_historia || 'Sin título'}\n`);
      if (h.rol && h.quiero && h.para_que) {
        items.push(`> Como **${h.rol}**, quiero **${h.quiero}**, para **${h.para_que}**.\n`);
      }
      if (h.prioridad) items.push(`- **Prioridad:** ${h.prioridad}`);
      if (h.estimacion) items.push(`- **Estimación:** ${h.estimacion}`);
      if (h.criterios_aceptacion) items.push(`- **Criterios de aceptación:** ${h.criterios_aceptacion}`);
      items.push('');
    });
    return ['## 8. Historias de Usuario\n', ...items].join('\n');
  }

  private buildDocumentosSection(list: AnalisisDocumento[]): string {
    const items: string[] = [];
    list.forEach((d, i) => {
      items.push(`### Análisis ${i + 1}: ${d.titulo}\n`);
      items.push(`- **Tipo de documento:** ${d.tipoDocumento}`);
      if (d.fuente) items.push(`- **Fuente:** ${d.fuente}`);
      if (d.hallazgos?.length) {
        items.push('\n**Hallazgos:**\n');
        d.hallazgos.forEach(h => items.push(`- ${h}`));
      }
      if (d.recomendaciones) {
        items.push(`\n**Recomendaciones:** ${d.recomendaciones}`);
      }
      items.push('');
    });
    return ['## 9. Análisis de Documentos\n', ...items].join('\n');
  }

  private buildSeguimientoSection(list: SeguimientoResponse[]): string {
    const items: string[] = [];
    list.forEach((s, i) => {
      items.push(`### Seguimiento ${i + 1}: ${s.titulo}\n`);
      items.push(`- **Proceso:** ${s.nombreProceso}`);
      if (s.pasos?.length) {
        items.push('\n**Pasos:**\n');
        s.pasos.forEach((p, j) => {
          items.push(`${j + 1}. ${p.nombre} (duración: ${p.duracion}, responsable: ${p.responsable})`);
        });
      }
      if (s.problemas?.length) {
        items.push('\n**Problemas detectados:**\n');
        s.problemas.forEach(p => items.push(`- ⚠️ ${p}`));
      }
      if (s.metricas?.length) {
        items.push('\n**Métricas:**\n');
        s.metricas.forEach(m => items.push(`- ${m.nombre}: ${m.valor}`));
      }
      items.push('');
    });
    return ['## 10. Seguimiento de Transacciones\n', ...items].join('\n');
  }

  private buildDiagramasSection(list: UmlDiagram[]): string {
    const grouped: Record<string, UmlDiagram[]> = {};
    list.forEach(d => {
      if (!grouped[d.tipo]) grouped[d.tipo] = [];
      grouped[d.tipo].push(d);
    });

    const tipoLabels: Record<string, string> = {
      'clases': 'Diagramas de Clases',
      'casos-uso': 'Diagramas de Casos de Uso',
      'secuencia': 'Diagramas de Secuencia',
      'paquetes': 'Diagramas de Paquetes',
    };

    const items: string[] = [];
    for (const tipo of Object.keys(grouped)) {
      items.push(`### ${tipoLabels[tipo] || tipo}\n`);
      grouped[tipo].forEach(d => {
        items.push(`**${d.nombre}** — ${d.descripcion || 'Sin descripción'}`);
        if (d.nodes.length > 0) {
          items.push(`\nElementos del diagrama:\n`);
          d.nodes.forEach(n => {
            items.push(`- [${n.kind}] ${n.label}`);
          });
        }
        items.push('');
      });
    }
    return ['## 11. Arquitectura — Diagramas UML\n', ...items].join('\n');
  }

  private buildInstruccionesSection(config: PromptConfig): string {
    const stack: string[] = [];
    if (config.stackFrontend) stack.push(`- **Frontend:** ${config.stackFrontend}`);
    if (config.stackBackend) stack.push(`- **Backend:** ${config.stackBackend}`);
    if (config.stackDatabase) stack.push(`- **Base de datos:** ${config.stackDatabase}`);
    if (config.stackExtra) stack.push(`- **Adicional:** ${config.stackExtra}`);

    return [
      '---\n',
      '## Instrucciones de Generación\n',
      'Con base en toda la información anterior, genera el código fuente del sistema solicitado.\n',
      '### Stack Tecnológico\n',
      ...stack,
      '',
      `### Arquitectura\n`,
      `- **Tipo:** ${config.arquitectura}`,
      '',
      `### Alcance del Entregable\n`,
      `- ${config.alcance}`,
      '',
      '### Convenciones\n',
      '- Código limpio y bien documentado',
      '- Nombres de variables y funciones descriptivos',
      '- Separación de responsabilidades (controladores, servicios, modelos)',
      '- Manejo adecuado de errores',
      '- Validación de datos de entrada',
      '',
    ].join('\n');
  }
}
