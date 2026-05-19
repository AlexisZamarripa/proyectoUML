import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ProyectoApiService, Proyecto } from './proyecto-api.service';
import { StakeholderApiService, Stakeholder } from './stakeholder-api.service';
import { ProcesoApiService, Proceso } from './proceso-api.service';
import { EntrevistaApiService, Entrevista } from './Entrevista-api.service';
import { EncuestaApiService, Encuesta } from './Encuesta-api.service';
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

export interface DesignConfig {
  uiFramework: string;
  designStyle: string;
  colorPrimary: string;
  layoutType: string;
  darkMode: boolean;
  notasDiseno: string;
}

export interface PromptConfig {
  sections: PromptSection[];
  stackFrontend: string;
  stackBackend: string;
  stackDatabase: string;
  stackExtra: string;
  arquitectura: string;
  alcance: string;
  design: DesignConfig;
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
      stackDatabase: 'PostgreSQL',
      stackExtra: '',
      arquitectura: 'Monolito modular',
      alcance: 'Aplicación completa (frontend + backend + base de datos)',
      design: {
        uiFramework: 'Tailwind CSS',
        designStyle: 'Minimal & Clean',
        colorPrimary: 'Azul Corporativo (#3b82f6)',
        layoutType: 'Sidebar + Contenido Principal',
        darkMode: false,
        notasDiseno: '',
      },
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

    const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Rol / System Prompt ────────────────────────────────────────────────
    parts.push(this.buildRolSection(data, config));

    parts.push('# Solicitud de Desarrollo de Software\n');
    parts.push(`> **Generado el:** ${date}  `);
    parts.push(`> **Proyecto:** ${data.proyecto.nombre}  `);
    parts.push(`> **Stack:** ${[config.stackFrontend, config.stackBackend, config.stackDatabase].filter(Boolean).join(' · ')}  `);
    parts.push(`> **Arquitectura:** ${config.arquitectura || 'No definida'}\n`);
    parts.push('---\n');

    // ── Advertencias de datos faltantes ────────────────────────────────────
    const advertencias = this.buildAdvertenciasSection(data, config);
    if (advertencias) parts.push(advertencias);

    parts.push('## Contexto General\n');
    parts.push(
      'Este documento contiene el análisis completo de requerimientos del proyecto **' + data.proyecto.nombre + '**. ' +
      'Tu misión es generar el **código fuente completo, funcional y listo para ejecución local** ' +
      'siguiendo las instrucciones técnicas y los estándares de calidad definidos al final de este documento.\n'
    );
    parts.push('> **⚠️ Importante:** Lee **TODO** el documento antes de generar código. ' +
      'Cada sección aporta contexto esencial para tomar decisiones de diseño correctas. ' +
      'Si tienes dudas sobre un requerimiento, prioriza la interpretación más segura y documentada.\n');
    parts.push('> **📌 Nota:** Este prompt tiene prompts complementarios para **Diseño UI/UX** y **Base de Datos** ' +
      'que se generaron a partir de los mismos datos. Si los recibes, úsalos como referencia cruzada.\n');

    // ── Datos del proyecto ─────────────────────────────────────────────────
    if (enabled('proyecto')) parts.push(this.buildProyectoSection(data.proyecto));
    if (enabled('stakeholders') && data.stakeholders.length > 0) parts.push('---\n', this.buildStakeholdersSection(data.stakeholders));
    if (enabled('procesos') && data.procesos.length > 0) parts.push('---\n', this.buildProcesosSection(data.procesos));
    if (enabled('entrevistas') && data.entrevistas.length > 0) parts.push('---\n', this.buildEntrevistasSection(data.entrevistas));
    if (enabled('encuestas') && data.encuestas.length > 0) parts.push('---\n', this.buildEncuestasSection(data.encuestas));
    if (enabled('observaciones') && data.observaciones.length > 0) parts.push('---\n', this.buildObservacionesSection(data.observaciones));
    if (enabled('focusGroups') && data.focusGroups.length > 0) parts.push('---\n', this.buildFocusGroupsSection(data.focusGroups));
    if (enabled('historias') && data.historias.length > 0) parts.push('---\n', this.buildHistoriasSection(data.historias));
    if (enabled('documentos') && data.documentos.length > 0) parts.push('---\n', this.buildDocumentosSection(data.documentos));
    if (enabled('seguimientos') && data.seguimientos.length > 0) parts.push('---\n', this.buildSeguimientoSection(data.seguimientos));
    if (enabled('diagramas') && data.diagramas.length > 0) parts.push('---\n', this.buildDiagramasSection(data.diagramas));

    // ── Secciones sintetizadas (derivadas automáticamente) ─────────────────
    const glosario = this.buildGlosarioSection(data);
    if (glosario) parts.push('---\n', glosario);

    const reglas = this.buildReglasNegocioSection(data);
    if (reglas) parts.push('---\n', reglas);

    const validaciones = this.buildReglasValidacionSection(data);
    if (validaciones) parts.push('---\n', validaciones);

    const casosUso = this.buildCasosUsoUMLSection(data);
    if (casosUso) parts.push('---\n', casosUso);

    // ── Instrucciones técnicas ─────────────────────────────────────────────
    parts.push(this.buildInstruccionesSection(config));

    return parts.join('\n');
  }

  // ─────────────────────────────────────────────
  //  Builders de secciones
  // ─────────────────────────────────────────────

  private buildProyectoSection(p: Proyecto): string {
    return [
      '## 1. Información del Proyecto\n',
      `| Campo | Detalle |`,
      `|-------|---------|`,
      `| **Nombre** | ${p.nombre} |`,
      `| **Descripción** | ${p.descripcion} |`,
      `| **Estado** | ${p.estado} |`,
      `| **Fecha de inicio** | ${p.fechaInicio} |`,
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
      if (e.notas_contexto) items.push(`- **Contexto:** ${e.notas_contexto}`);
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
      items.push(`### HU-${String(i + 1).padStart(3, '0')}: ${h.titulo_historia || 'Sin título'}\n`);
      if (h.rol && h.quiero && h.para_que) {
        items.push(`> **Historia:** Como **${h.rol}**, quiero **${h.quiero}**, para **${h.para_que}**.\n`);
      }
      const meta: string[] = [];
      if (h.prioridad) meta.push(`**Prioridad:** ${h.prioridad}`);
      if (h.estimacion) meta.push(`**Estimación:** ${h.estimacion}`);
      if (meta.length) items.push(meta.join(' · '));
      if (h.criterios_aceptacion) {
        items.push('\n**Criterios de aceptación:**\n');
        const criterios = h.criterios_aceptacion.split(/[;\n]/).map(c => c.trim()).filter(Boolean);
        criterios.forEach(c => items.push(`- [ ] ${c}`));
      }
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
        items.push(`#### ${d.nombre}${d.descripcion ? ` — ${d.descripcion}` : ''}\n`);

        // ── Nodos / Clases / Actores ──────────────────────────────────────
        if (d.nodes?.length) {
          items.push('**Elementos:**\n');
          d.nodes.forEach(n => {
            let line = `- **[${n.kind}]** ${n.label}`;
            if (n.stereotype) line += ` «${n.stereotype}»`;
            items.push(line);

            if (n.attributes?.length) {
              items.push(`  - *Atributos:* ${n.attributes.map(a => `${a.visibility} ${a.text}`).join(', ')}`);
            }
            if (n.methods?.length) {
              items.push(`  - *Métodos:* ${n.methods.map(m => `${m.visibility} ${m.text}`).join(', ')}`);
            }
            if (n.noteText) {
              items.push(`  - *Nota:* ${n.noteText}`);
            }
          });
          items.push('');
        }

        // ── Relaciones ────────────────────────────────────────────────────
        if (d.relations?.length) {
          items.push('**Relaciones:**\n');
          d.relations.forEach(r => {
            const src = d.nodes?.find(n => n.id === r.sourceId)?.label ?? r.sourceId;
            const tgt = d.nodes?.find(n => n.id === r.targetId)?.label ?? r.targetId;
            const lbl = r.label ? ` (${r.label})` : '';
            items.push(`- ${src} --[${r.kind}]--> ${tgt}${lbl}`);
          });
          items.push('');
        }

        // ── Mensajes de secuencia ─────────────────────────────────────────
        if (d.messages?.length) {
          items.push('**Mensajes de secuencia:**\n');
          [...d.messages]
            .sort((a, b) => a.order - b.order)
            .forEach(m => {
              const src = d.nodes?.find(n => n.id === m.sourceId)?.label ?? m.sourceId;
              const tgt = d.nodes?.find(n => n.id === m.targetId)?.label ?? m.targetId;
              items.push(`- ${m.order}. \`${m.kind}\` ${src} → ${tgt}: **${m.label}**`);
            });
          items.push('');
        }

        // ── Fragmentos ────────────────────────────────────────────────────
        if (d.fragments?.length) {
          items.push('**Fragmentos combinados:**\n');
          d.fragments.forEach(f => {
            const cond = f.condition ? ` [condición: ${f.condition}]` : '';
            items.push(`- \`${f.kind}\` **${f.label}**${cond}`);
          });
          items.push('');
        }
      });
    }

    return ['## 11. Arquitectura — Diagramas UML\n', ...items].join('\n');
  }

  // ─────────────────────────────────────────────
  //  Secciones Sintetizadas (generadas automáticamente)
  // ─────────────────────────────────────────────

  private buildRolSection(data: ProjectData, config: PromptConfig): string {
    const stack = [config.stackFrontend, config.stackBackend, config.stackDatabase].filter(Boolean).join(', ');
    return [
      '## 🧠 Rol del Agente\n',
      `Eres un **ingeniero de software senior full-stack** con más de 15 años de experiencia en desarrollo de aplicaciones empresariales. ` +
      `Dominas profundamente **${stack}** y la arquitectura **${config.arquitectura || 'modular'}**.\n`,
      'Tu enfoque:\n',
      '1. **Analiza** todo el documento de requerimientos antes de escribir una sola línea de código.',
      '2. **Planifica** la arquitectura y la estructura de carpetas antes de implementar.',
      '3. **Identifica** las entidades del dominio, sus relaciones y las reglas de negocio.',
      '4. **Implementa** siguiendo las mejores prácticas del stack seleccionado.',
      '5. **Valida** que cada componente cumple con los criterios de aceptación documentados.',
      '',
      '> **Instrucción de razonamiento:** Antes de generar código, piensa paso a paso:',
      '> 1. ¿Qué entidades necesito crear?',
      '> 2. ¿Qué relaciones existen entre ellas?',
      '> 3. ¿Qué endpoints/servicios necesito?',
      '> 4. ¿Qué validaciones debe tener cada campo?',
      '> 5. ¿Qué flujos de usuario debo soportar?',
      '',
      '---\n',
    ].join('\n');
  }

  private buildAdvertenciasSection(data: ProjectData, config: PromptConfig): string {
    const warnings: string[] = [];
    const enabled = (id: string) => config.sections.find(s => s.id === id)?.enabled ?? true;

    if (data.historias.length === 0 && enabled('historias')) {
      warnings.push('⚠️ **No hay Historias de Usuario definidas.** El agente deberá inferir los módulos y funcionalidades a partir de los procesos y entrevistas. Se recomienda agregar historias de usuario para obtener mejores resultados.');
    }
    if (data.diagramas.length === 0 && enabled('diagramas')) {
      warnings.push('⚠️ **No hay Diagramas UML.** El agente deberá inferir la estructura de entidades y relaciones. Se recomienda crear al menos un diagrama de clases.');
    }
    if (data.procesos.length === 0 && enabled('procesos')) {
      warnings.push('⚠️ **No hay Procesos de Negocio definidos.** El agente no tendrá contexto sobre los flujos de trabajo del sistema.');
    }
    if (data.stakeholders.length === 0 && enabled('stakeholders')) {
      warnings.push('⚠️ **No hay Stakeholders definidos.** El agente no conocerá los roles de usuario del sistema.');
    }
    if (data.entrevistas.length === 0 && data.encuestas.length === 0 && data.observaciones.length === 0 && data.focusGroups.length === 0) {
      warnings.push('⚠️ **No hay datos de investigación (entrevistas, encuestas, observaciones, focus groups).** Las reglas de negocio no podrán sintetizarse automáticamente.');
    }

    const classDiags = data.diagramas.filter(d => d.tipo === 'clases');
    if (classDiags.length === 0 && data.diagramas.length > 0) {
      warnings.push('ℹ️ **No hay diagrama de clases.** El agente deberá inferir las entidades. Se recomienda crear un diagrama de clases para definir la estructura de datos.');
    }

    if (warnings.length === 0) return '';

    return [
      '## ⚠️ Notas sobre los Datos del Proyecto\n',
      ...warnings.map(w => `- ${w}`),
      '',
    ].join('\n');
  }

  private buildGlosarioSection(data: ProjectData): string {
    const terms = new Map<string, string>();

    // Extraer términos de procesos
    data.procesos.forEach(p => {
      terms.set(p.nombre, `Proceso de negocio: ${p.descripcion?.substring(0, 80) || 'sin descripción'}${p.descripcion && p.descripcion.length > 80 ? '...' : ''}`);
      p.subprocesos?.forEach(sp => {
        terms.set(sp.nombre, `Subproceso de "${p.nombre}": ${sp.descripcion?.substring(0, 60) || 'sin descripción'}${sp.descripcion && sp.descripcion.length > 60 ? '...' : ''}`);
      });
    });

    // Extraer roles de stakeholders
    const roles = new Set<string>();
    data.stakeholders.forEach(s => {
      if (s.rol) roles.add(s.rol);
      if (s.area) terms.set(s.area, `Área organizacional donde operan stakeholders`);
    });
    roles.forEach(r => terms.set(r, 'Rol de usuario del sistema'));

    // Extraer entidades de diagramas de clases
    data.diagramas.filter(d => d.tipo === 'clases').forEach(d => {
      d.nodes?.forEach(n => {
        if (n.kind === 'class' || n.kind === 'interface' || n.kind === 'abstract') {
          const attrs = n.attributes?.map(a => a.text).join(', ') || 'sin atributos';
          terms.set(n.label, `Entidad del dominio (${n.kind})${n.stereotype ? ` «${n.stereotype}»` : ''} — atributos: ${attrs}`);
        }
      });
    });

    // Extraer roles de historias de usuario
    data.historias.forEach(h => {
      if (h.rol && !terms.has(h.rol)) {
        terms.set(h.rol, 'Rol de usuario mencionado en historias de usuario');
      }
    });

    if (terms.size === 0) return '';

    const sorted = Array.from(terms.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'));
    const items = sorted.map(([term, desc]) => `| **${term}** | ${desc} |`);

    return [
      '## 📖 Glosario del Dominio (Ubiquitous Language)\n',
      'Usa estos nombres **exactamente** como se definen aquí en todo el código (variables, clases, endpoints, tablas de BD). ' +
      'La consistencia en el vocabulario es fundamental para la mantenibilidad del sistema.\n',
      '| Término | Definición |',
      '|---------|-----------|',
      ...items,
      '',
    ].join('\n');
  }

  private buildReglasNegocioSection(data: ProjectData): string {
    const reglas: string[] = [];
    let reglaNum = 1;

    // Extraer reglas de entrevistas (de las respuestas)
    data.entrevistas.forEach(e => {
      e.preguntas?.forEach(q => {
        if (q.respuesta && q.respuesta.length > 15) {
          // Buscar patrones de reglas de negocio en respuestas
          const resp = q.respuesta;
          if (this.containsBusinessRulePattern(resp)) {
            reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Entrevista: "${e.titulo_entrevista || 'Sin título'}"): ${this.extractBusinessRule(resp)}`);
          }
        }
      });
    });

    // Extraer reglas de observaciones (hallazgos)
    data.observaciones.forEach(o => {
      if (o.hallazgos_puntos_clave) {
        const hallazgos = o.hallazgos_puntos_clave.split(/[;.\n]/).map(h => h.trim()).filter(h => h.length > 10);
        hallazgos.forEach(h => {
          reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Observación: "${o.titulo}"): ${h}`);
        });
      }
    });

    // Extraer reglas de focus groups (conclusiones)
    data.focusGroups.forEach(fg => {
      if (fg.conclusiones) {
        const conclusiones = fg.conclusiones.split(/[;.\n]/).map(c => c.trim()).filter(c => c.length > 10);
        conclusiones.forEach(c => {
          reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Focus Group: "${fg.nombre_focus}"): ${c}`);
        });
      }
    });

    // Extraer reglas de documentos (hallazgos y recomendaciones)
    data.documentos.forEach(d => {
      d.hallazgos?.forEach(h => {
        if (h.length > 10) {
          reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Documento: "${d.titulo}"): ${h}`);
        }
      });
      if (d.recomendaciones && d.recomendaciones.length > 10) {
        const recs = d.recomendaciones.split(/[;.\n]/).map(r => r.trim()).filter(r => r.length > 10);
        recs.forEach(r => {
          reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Recomendación doc: "${d.titulo}"): ${r}`);
        });
      }
    });

    // Extraer reglas de seguimientos (problemas)
    data.seguimientos.forEach(s => {
      s.problemas?.forEach(p => {
        if (p.length > 10) {
          reglas.push(`**RN-${String(reglaNum++).padStart(3, '0')}** (Problema detectado: "${s.titulo}"): El sistema debe resolver: ${p}`);
        }
      });
    });

    if (reglas.length === 0) return '';

    return [
      '## 📋 Reglas de Negocio Sintetizadas\n',
      'Las siguientes reglas fueron extraídas automáticamente de las entrevistas, observaciones, focus groups, documentos y seguimientos del proyecto. ' +
      '**Cada regla debe ser implementada en la lógica de negocio del backend** y validada en el frontend cuando aplique.\n',
      ...reglas.map(r => `- ${r}`),
      '',
      '> **Nota:** Si alguna regla es ambigua, implementa la interpretación más restrictiva y documenta la decisión en un comentario del código.\n',
    ].join('\n');
  }

  private buildReglasValidacionSection(data: ProjectData): string {
    const validaciones: { historia: string; criterios: string[] }[] = [];

    data.historias.forEach((h, i) => {
      if (!h.criterios_aceptacion) return;
      const criterios = h.criterios_aceptacion.split(/[;\n]/).map(c => c.trim()).filter(c => c.length > 0);
      if (criterios.length > 0) {
        validaciones.push({
          historia: `HU-${String(i + 1).padStart(3, '0')}: ${h.titulo_historia || 'Sin título'}`,
          criterios,
        });
      }
    });

    if (validaciones.length === 0) return '';

    const items: string[] = [];
    validaciones.forEach(v => {
      items.push(`### ${v.historia}\n`);
      v.criterios.forEach((c, i) => {
        items.push(`${i + 1}. ${c}`);
      });
      items.push('');
    });

    return [
      '## ✅ Reglas de Validación (Criterios de Aceptación)\n',
      'Cada criterio listado a continuación es una **condición verificable** que el código generado debe cumplir. ' +
      'Úsalos como base para validaciones en el backend (DTOs, guards, middleware) y en el frontend (validadores de formulario, UX).\n',
      ...items,
    ].join('\n');
  }

  private buildCasosUsoUMLSection(data: ProjectData): string {
    const casosUsoDiags = data.diagramas.filter(d => d.tipo === 'casos-uso');
    if (casosUsoDiags.length === 0) return '';

    const items: string[] = [];
    casosUsoDiags.forEach(d => {
      items.push(`### ${d.nombre}${d.descripcion ? ` — ${d.descripcion}` : ''}\n`);

      // Separar actores de casos de uso
      const actores = d.nodes?.filter(n => n.kind === 'actor') || [];
      const casosUso = d.nodes?.filter(n => n.kind !== 'actor' && n.kind !== 'note') || [];
      const notas = d.nodes?.filter(n => n.kind === 'note') || [];

      if (actores.length > 0) {
        items.push('**Actores del sistema:**\n');
        actores.forEach(a => {
          // Buscar qué casos de uso tiene conectados
          const relaciones = d.relations?.filter(r => r.sourceId === a.id || r.targetId === a.id) || [];
          const casosConectados = relaciones.map(r => {
            const otherId = r.sourceId === a.id ? r.targetId : r.sourceId;
            return d.nodes?.find(n => n.id === otherId)?.label || otherId;
          });
          items.push(`- **${a.label}**${casosConectados.length > 0 ? ` → Participa en: ${casosConectados.join(', ')}` : ''}`);
        });
        items.push('');
      }

      if (casosUso.length > 0) {
        items.push('**Casos de uso:**\n');
        casosUso.forEach(cu => {
          items.push(`- **${cu.label}**${cu.stereotype ? ` «${cu.stereotype}»` : ''}${cu.noteText ? ` — Nota: ${cu.noteText}` : ''}`);

          // Buscar relaciones de include/extend
          const rels = d.relations?.filter(r => r.sourceId === cu.id || r.targetId === cu.id) || [];
          rels.forEach(r => {
            if (r.kind === 'include' || r.kind === 'extend' || r.label?.includes('include') || r.label?.includes('extend')) {
              const otherId = r.sourceId === cu.id ? r.targetId : r.sourceId;
              const other = d.nodes?.find(n => n.id === otherId)?.label || otherId;
              items.push(`  - ${r.kind === 'include' || r.label?.includes('include') ? '«include»' : '«extend»'} → ${other}`);
            }
          });
        });
        items.push('');
      }

      if (notas.length > 0) {
        items.push('**Notas:**\n');
        notas.forEach(n => {
          items.push(`- ${n.noteText || n.label}`);
        });
        items.push('');
      }
    });

    return [
      '## 🎭 Casos de Uso — Flujos de Interacción\n',
      'Los siguientes diagramas de casos de uso definen las interacciones entre los actores y el sistema. ' +
      'Cada caso de uso debe traducirse en **al menos un endpoint en el backend** y **una vista o acción en el frontend**.\n',
      ...items,
    ].join('\n');
  }

  /** Detecta si una cadena contiene patrones de regla de negocio */
  private containsBusinessRulePattern(text: string): boolean {
    const patterns = [
      /debe[ns]?\s/i, /no\s+puede/i, /no\s+debe/i, /siempre\s/i, /nunca\s/i,
      /obligatori/i, /requiere/i, /necesita/i, /máximo/i, /mínimo/i,
      /solo\s+puede/i, /únicamente/i, /no\s+se\s+permite/i, /es\s+necesario/i,
      /tiene\s+que/i, /hay\s+que/i, /se\s+requiere/i, /importante/i,
      /validar/i, /verificar/i, /comprobar/i, /asegurar/i,
      /restricci[oó]n/i, /limitaci[oó]n/i, /condici[oó]n/i,
    ];
    return patterns.some(p => p.test(text));
  }

  /** Extrae y limpia una regla de negocio de un texto */
  private extractBusinessRule(text: string): string {
    // Limitar a ~200 chars, cortar en punto o coma más cercano
    let clean = text.trim();
    if (clean.length > 200) {
      const cutoff = clean.lastIndexOf('.', 200);
      clean = cutoff > 50 ? clean.substring(0, cutoff + 1) : clean.substring(0, 200) + '...';
    }
    return clean;
  }

  private buildFlujosUsuarioSection(data: ProjectData): string {
    const casosUsoDiags = data.diagramas.filter(d => d.tipo === 'casos-uso');
    if (casosUsoDiags.length === 0 && data.historias.length === 0) return '';

    const items: string[] = [];

    // Flujos derivados de diagramas de casos de uso
    casosUsoDiags.forEach(d => {
      const actores = d.nodes?.filter(n => n.kind === 'actor') || [];

      actores.forEach(actor => {
        const relaciones = d.relations?.filter(r => r.sourceId === actor.id || r.targetId === actor.id) || [];
        const casosConectados = relaciones.map(r => {
          const otherId = r.sourceId === actor.id ? r.targetId : r.sourceId;
          return d.nodes?.find(n => n.id === otherId)?.label || otherId;
        }).filter(Boolean);

        if (casosConectados.length > 0) {
          items.push(`### Flujo: ${actor.label}\n`);
          items.push(`El usuario con rol **${actor.label}** interactúa con el sistema a través de:\n`);
          casosConectados.forEach((cu, i) => {
            items.push(`${i + 1}. **${cu}** → Diseñar vista/modal correspondiente`);
          });
          items.push('');
        }
      });
    });

    // Flujos derivados de historias de usuario agrupadas por rol
    if (data.historias.length > 0) {
      const porRol = new Map<string, string[]>();
      data.historias.forEach(h => {
        const rol = h.rol || 'Usuario';
        if (!porRol.has(rol)) porRol.set(rol, []);
        porRol.get(rol)!.push(h.quiero || h.titulo_historia || 'Acción no definida');
      });

      porRol.forEach((acciones, rol) => {
        // Solo agregar si no fue cubierto por los diagramas de casos de uso
        const yaCubierto = items.some(item => item.includes(`Flujo: ${rol}`));
        if (!yaCubierto) {
          items.push(`### Flujo: ${rol}\n`);
          items.push(`El usuario con rol **${rol}** necesita:\n`);
          acciones.forEach((a, i) => {
            items.push(`${i + 1}. ${a}`);
          });
          items.push('');
        }
      });
    }

    if (items.length === 0) return '';

    return [
      '## 🔄 Flujos de Usuario\n',
      'Los siguientes flujos de navegación fueron derivados de los diagramas de casos de uso y las historias de usuario. ' +
      'Cada flujo representa un recorrido que el usuario hace por la aplicación.\n',
      ...items,
    ].join('\n');
  }

  private buildInstruccionesSection(config: PromptConfig): string {
    const stack: string[] = [];
    if (config.stackFrontend) stack.push(`- **Frontend:** ${config.stackFrontend}`);
    if (config.stackBackend) stack.push(`- **Backend:** ${config.stackBackend}`);
    if (config.stackDatabase) stack.push(`- **Base de datos:** ${config.stackDatabase}`);
    if (config.stackExtra) stack.push(`- **Tecnologías adicionales:** ${config.stackExtra}`);

    const specificInstructions = this.getStackSpecificInstructions(config);

    return [
      '---\n',
      '## Instrucciones de Generación\n',
      'Con base en toda la información anterior, genera el código fuente **completo y funcional** del sistema. ' +
      'Sigue estrictamente cada directriz de esta sección.\n',

      '### 1. Stack Tecnológico\n',
      ...stack,
      '',

      '### 2. Arquitectura\n',
      `- **Tipo:** ${config.arquitectura || 'Sin definir'}`,
      '- Organiza el código respetando la separación de capas que implica esta arquitectura.',
      '- Cada capa debe tener una responsabilidad única y clara.',
      '',

      '### 3. Alcance del Entregable\n',
      `- ${config.alcance || 'Aplicación completa (frontend + backend + base de datos)'}`,
      '- Incluye estructura de carpetas, archivos de configuración y todas las dependencias.',
      '- El código debe poder ejecutarse localmente siguiendo las instrucciones que proveas.',
      '',

      '### 4. Instrucciones Específicas por Tecnología\n',
      ...specificInstructions,

      '### 5. Buenas Prácticas de Programación\n',
      'Aplica **obligatoriamente** los siguientes estándares:\n',

      '#### 5.1 Principios SOLID\n',
      '- **S** — Single Responsibility: cada clase/módulo tiene una única razón para cambiar.',
      '- **O** — Open/Closed: abierto para extensión, cerrado para modificación.',
      '- **L** — Liskov Substitution: las subclases pueden sustituir a sus clases base.',
      '- **I** — Interface Segregation: interfaces específicas mejor que una general.',
      '- **D** — Dependency Inversion: depende de abstracciones, no de implementaciones concretas.',
      '',

      '#### 5.2 Código Limpio (Clean Code)\n',
      '- Nombres **descriptivos** en el idioma del proyecto (variables, funciones, clases).',
      '- Funciones con **una sola responsabilidad** (máx. ~20 líneas).',
      '- Sin código muerto ni comentado. Sin números mágicos (usa constantes nombradas).',
      '- Evita anidaciones > 3 niveles; aplica early returns para reducir profundidad.',
      '',

      '#### 5.3 DRY — Don\'t Repeat Yourself\n',
      '- Extrae lógica repetida en funciones, servicios o helpers reutilizables.',
      '- Usa composición, herencia o mixins cuando sea apropiado.',
      '',

      '#### 5.4 Manejo de Errores\n',
      '- Manejo explícito en **todas** las operaciones asíncronas.',
      '- Códigos HTTP correctos: 400 (validación), 401 (no autenticado), 403 (no autorizado), 404 (no encontrado), 422 (entidad no procesable), 500 (error interno).',
      '- Mensajes de error claros para el cliente; detalles técnicos solo en logs del servidor.',
      '- No expongas stack traces ni información interna al cliente.',
      '',

      '#### 5.5 Seguridad (OWASP Top 10)\n',
      '- **Validación de entrada** en backend con DTOs y class-validator (o equivalente).',
      '- **Sanitización** de datos antes de persistir o renderizar.',
      '- **Auth/Authz** con JWT y guards/middleware en todos los endpoints protegidos.',
      '- **Evita SQL Injection**: usa ORM o query builder con parámetros enlazados.',
      '- **Secrets en variables de entorno** (`.env`); nunca hardcodeados.',
      '- **Cabeceras de seguridad**: Helmet (Node) o equivalente.',
      '',

      '#### 5.6 Calidad y Mantenibilidad\n',
      '- Pruebas unitarias para toda la lógica de negocio crítica.',
      '- Documenta la API con Swagger/OpenAPI (`@nestjs/swagger` o equivalente).',
      '- Versiona la API: `/api/v1/`.',
      '- Usa ESLint + Prettier (o equivalente) con las reglas del proyecto.',
      '',

      '#### 5.7 Rendimiento\n',
      '- Paginación en todos los endpoints de listas.',
      '- Índices en columnas usadas en WHERE, JOIN y ORDER BY.',
      '- Evita N+1 queries; usa eager loading o joins apropiados.',
      '- Lazy loading de módulos/rutas en el frontend.',
      '',

      '### 6. Proceso de Desarrollo — Chain of Thought\n',
      'Antes de generar código, documenta tu razonamiento:\n',
      '1. **Análisis de entidades:** Lista todas las entidades que identificas y sus relaciones.',
      '2. **Mapa de endpoints:** Lista todos los endpoints REST que vas a crear (método, ruta, descripción).',
      '3. **Plan de componentes:** Lista los componentes/vistas del frontend y qué datos consumen.',
      '4. **Decisiones de diseño:** Documenta cualquier decisión que tomes ante ambigüedad en los requerimientos.',
      '5. **Implementación:** Solo después de los pasos anteriores, genera el código.\n',
      '',

      '### 7. Entregables — Orden de Generación\n',
      '1. **Análisis previo** — Resumen de tu interpretación de los requerimientos (entidades, relaciones, endpoints).',
      '2. **Estructura del proyecto** — Árbol de carpetas completo con explicación de cada directorio.',
      '3. **Configuración** — `.env.example`, `package.json` (frontend y backend), archivos de configuración.',
      '4. **Base de datos** — Migraciones, esquema SQL o entidades ORM, seeds.',
      '5. **Backend** — Módulos, servicios, controladores, guards, DTOs, pipes, interceptors.',
      '6. **Frontend** — Componentes, servicios HTTP, rutas, guards, modelos/interfaces.',
      '7. **Instrucciones de ejecución** — README.md con pasos para instalar, configurar y ejecutar el proyecto.',
      '',

      '### 8. Formato de Output\n',
      'Genera el código **archivo por archivo** usando este formato exacto:\n',
      '```',
      '📁 ruta/completa/al/archivo.ext',
      '```',
      '```lenguaje',
      '// contenido del archivo',
      '```\n',
      '- Usa **rutas relativas** desde la raíz del proyecto.',
      '- Incluye **todos** los imports necesarios en cada archivo.',
      '- No uses comentarios tipo `// ... rest of the code` — genera el archivo **completo**.',
      '- Si un archivo es muy largo (>300 líneas), divídelo en módulos más pequeños.',
      '',

      '---\n',
      '> 📌 **Recuerda:** Este prompt tiene prompts complementarios para **Diseño UI/UX** y **Base de Datos** generados a partir de los mismos datos del proyecto. ' +
      'Si los recibes, úsalos como fuente de verdad para la interfaz y el esquema de BD.\n',
      '> 🎯 **Prioriza calidad sobre velocidad.** El código debe ser funcional, tipado, documentado y listo para ejecutarse en un entorno de desarrollo local.\n',
    ].join('\n');
  }

  private getStackSpecificInstructions(config: PromptConfig): string[] {
    const lines: string[] = [];

    // ── Frontend ──────────────────────────────────────────────────────────
    if (config.stackFrontend.includes('Angular')) {
      lines.push(
        '#### Frontend — Angular\n',
        '- Usa **standalone components** (`standalone: true`); evita NgModules salvo para librerías externas.',
        '- Estado reactivo con **signals** (`signal()`, `computed()`, `effect()`); usa RxJS solo para streams de datos asíncronos.',
        '- Desuscríbete con `takeUntilDestroyed()` en lugar de ngOnDestroy manual.',
        '- **Lazy loading** obligatorio en todas las rutas: `loadComponent()` en `app.routes.ts`.',
        '- Formularios complejos con **Reactive Forms** (`FormBuilder`); template-driven solo para formularios simples.',
        '- **HttpClient** con interceptors para inyección del token JWT y manejo global de errores.',
        '- Servicios con `providedIn: \'root\'` a menos que el scope sea local al componente.',
        '',
      );
    } else if (config.stackFrontend.includes('React')) {
      lines.push(
        '#### Frontend — React\n',
        '- Solo componentes **funcionales** con hooks; nunca class components.',
        '- Estado global con **Zustand** (proyectos medianos) o **Redux Toolkit** (proyectos grandes).',
        '- Server state con **TanStack Query (React Query)**; nunca uses `useEffect` para fetching.',
        '- Rutas con **React Router v6**: rutas anidadas, loaders y `createBrowserRouter`.',
        '- `useMemo`, `useCallback` y `React.memo` solo donde medir un problema real de rendimiento.',
        '- **TypeScript** estricto: interfaces para todos los props, estados y respuestas de API.',
        '',
      );
    } else if (config.stackFrontend.includes('Vue')) {
      lines.push(
        '#### Frontend — Vue.js\n',
        '- Usa la **Composition API** con `<script setup lang="ts">` en todos los componentes.',
        '- Estado global con **Pinia**; nunca uses Vuex.',
        '- Rutas con **Vue Router 4**; lazy imports y navigation guards.',
        '- `ref()` para primitivos, `reactive()` para objetos; `computed()` para derivados.',
        '- `defineProps`, `defineEmits` y `defineExpose` siempre tipados con TypeScript.',
        '',
      );
    } else if (config.stackFrontend.includes('Next')) {
      lines.push(
        '#### Frontend — Next.js\n',
        '- Usa el **App Router** (`app/`); no uses el Pages Router.',
        '- **Server Components** por defecto; `"use client"` solo cuando necesitas interactividad o browser APIs.',
        '- Data fetching con `fetch()` nativo en Server Components y opciones de revalidación (`next: { revalidate }`). ',
        '- **Server Actions** para mutaciones; nunca expongas endpoints API innecesariamente.',
        '- Usa `<Suspense>` y `loading.tsx` para estados de carga por segmento de ruta.',
        '- Optimiza imágenes con `<Image>` de `next/image` y fuentes con `next/font`.',
        '',
      );
    }

    // ── Backend ───────────────────────────────────────────────────────────
    if (config.stackBackend.includes('NestJS')) {
      lines.push(
        '#### Backend — NestJS\n',
        '- Un **módulo de feature** (`@Module`) por dominio; importa solo lo que necesita.',
        '- **DTOs** con `class-validator` decorators en toda entrada (`@IsString`, `@IsEmail`, `@IsNotEmpty`).',
        '- `ValidationPipe` global con `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.',
        '- **Guards** JWT (`@UseGuards(JwtAuthGuard)`) y de roles en cada endpoint protegido.',
        '- **Interceptors** para transformación de respuesta y logging; **Filters** para excepciones.',
        '- ORM con **TypeORM** o **Prisma**; nunca raw queries sin parámetros enlazados.',
        '- **Swagger** con `@nestjs/swagger`: `@ApiOperation`, `@ApiResponse`, `@ApiTags` en cada controller.',
        '- Config con `@nestjs/config` + validación de variables de entorno con **Joi**.',
        '',
      );
    } else if (config.stackBackend.includes('Express')) {
      lines.push(
        '#### Backend — Express.js\n',
        '- Estructura en capas: `routes/` → `controllers/` → `services/` → `repositories/` → `models/`.',
        '- Validación con **Zod** o **Joi** en middleware antes de llegar al controller.',
        '- Auth con **passport-jwt** o middleware manual de verificación de JWT.',
        '- Monta todas las rutas bajo `/api/v1/` con `express.Router()` por recurso.',
        '- Error handler centralizado `(err, req, res, next)` como **último middleware**.',
        '- Aplica **helmet**, **cors**, **compression** y **express-rate-limit** de forma global.',
        '',
      );
    } else if (config.stackBackend.includes('Spring Boot')) {
      lines.push(
        '#### Backend — Spring Boot\n',
        '- Arquitectura en capas: `@RestController` → `@Service` → `@Repository` (Spring Data JPA).',
        '- Validación con **Bean Validation** en los DTOs: `@Valid`, `@NotNull`, `@Size`, `@Email`.',
        '- **Spring Security** con JWT: configura `SecurityFilterChain` con `stateless` session.',
        '- Nunca expongas entidades JPA directamente; usa **DTOs** mapeados con MapStruct.',
        '- Documenta con **SpringDoc OpenAPI** (`springdoc-openapi-starter-webmvc-ui`).',
        '- Externaliza toda la config en `application.yml`; usa perfiles `dev` y `prod`.',
        '',
      );
    } else if (config.stackBackend.includes('FastAPI')) {
      lines.push(
        '#### Backend — FastAPI\n',
        '- **Pydantic v2** para todos los schemas de request/response; valida tipos en tiempo de ejecución.',
        '- Rutas con **APIRouter**; monta cada router con `prefix` y `tags`.',
        '- **Dependency Injection** de FastAPI para sesiones de BD, servicios y el usuario autenticado.',
        '- `async def` en todos los endpoints; usa `asyncpg` o `databases` para consultas async.',
        '- ORM con **SQLAlchemy 2.0** (async) o **Tortoise ORM**.',
        '- La documentación `/docs` (Swagger UI) debe estar completa y actualizada.',
        '',
      );
    } else if (config.stackBackend.includes('Django')) {
      lines.push(
        '#### Backend — Django REST Framework\n',
        '- Usa **ViewSets** con **Routers** para reducir boilerplate de URLs.',
        '- **ModelSerializer** para CRUD estándar; serializers custom para lógica compleja.',
        '- Auth con **djangorestframework-simplejwt**; protege vistas con `IsAuthenticated`.',
        '- **Django ORM** con `select_related` y `prefetch_related` para evitar N+1.',
        '- Paginación global con `PageNumberPagination` en `REST_FRAMEWORK` settings.',
        '- Separa settings por entorno: `settings/base.py`, `settings/dev.py`, `settings/prod.py`.',
        '',
      );
    } else if (config.stackBackend.includes('Laravel')) {
      lines.push(
        '#### Backend — Laravel\n',
        '- **Form Requests** para toda validación; nunca valides directamente en el controlador.',
        '- **Eloquent** con relaciones bien definidas; usa `with()` para eager loading.',
        '- **Policies** para autorización a nivel de modelo; **Gates** para acciones globales.',
        '- **API Resources** para transformar respuestas; nunca devuelvas modelos directamente.',
        '- Auth con **Laravel Sanctum** (SPA/mobile) o **Passport** (OAuth2).',
        '- Tareas pesadas en **queued jobs**; tareas programadas con `artisan schedule`.',
        '',
      );
    }

    // ── Database ──────────────────────────────────────────────────────────
    if (['MySQL', 'PostgreSQL', 'MariaDB'].some(db => config.stackDatabase.includes(db))) {
      lines.push(
        `#### Base de Datos — ${config.stackDatabase}\n`,
        '- **Migraciones** versionadas para todo cambio de esquema (nunca modifiques la BD manual en producción).',
        '- **Índices** en todas las columnas usadas en WHERE, JOIN y ORDER BY.',
        '- **Foreign keys** con políticas de CASCADE / RESTRICT / SET NULL según la lógica de negocio.',
        '- **Transacciones** para operaciones que afectan múltiples tablas.',
        '- Contraseñas con **bcrypt** (costo ≥ 12); nunca MD5 ni SHA1.',
        ...(config.stackDatabase.includes('PostgreSQL')
          ? ['- Aprovecha tipos nativos de PostgreSQL: `uuid`, `jsonb`, `array`, `enum`, `timestamptz`.']
          : []),
        '',
      );
    } else if (config.stackDatabase.includes('MongoDB')) {
      lines.push(
        '#### Base de Datos — MongoDB\n',
        '- Define **schemas** con Mongoose: `required`, `index`, `unique`, `trim` en cada campo.',
        '- Usa **aggregation pipeline** para consultas complejas; evita `$where` (seguridad).',
        '- **Índices compuestos** para consultas frecuentes; **índices TTL** para expiración.',
        '- Transacciones multi-documento para operaciones atómicas.',
        '- Embebe subdocumentos cuando se acceden juntos; referencia cuando se acceden por separado.',
        '',
      );
    } else if (config.stackDatabase.includes('Firebase') || config.stackDatabase.includes('Firestore')) {
      lines.push(
        '#### Base de Datos — Firestore\n',
        '- Estructura colecciones orientada a las **consultas**, no al modelo relacional.',
        '- **Reglas de seguridad** de Firestore para proteger cada colección por rol de usuario.',
        '- **Batched writes** y **transactions** para operaciones atómicas.',
        '- Evita lecturas en bucle; usa `collectionGroup` y consultas compuestas con índices.',
        '',
      );
    }

    // ── Architecture ──────────────────────────────────────────────────────
    if (config.arquitectura === 'Clean Architecture') {
      lines.push(
        '#### Arquitectura — Clean Architecture\n',
        '- Capas obligatorias: `Domain` → `Application` → `Infrastructure` → `Presentation`.',
        '- `Domain`: entidades y reglas de negocio puras, **sin dependencias externas**.',
        '- `Application`: casos de uso (Use Cases), interfaces de repositorios e interfaces de servicios.',
        '- `Infrastructure`: implementaciones concretas (ORM, APIs externas, email, storage).',
        '- `Presentation`: controllers/resolvers que solo delegan a los casos de uso.',
        '- La dependencia siempre apunta **hacia adentro**; aplica inversión de dependencias.',
        '',
      );
    } else if (config.arquitectura === 'Microservicios') {
      lines.push(
        '#### Arquitectura — Microservicios\n',
        '- Cada servicio tiene su propia base de datos (**Database per Service**).',
        '- Comunicación síncrona via REST/gRPC; asíncrona via **RabbitMQ** o **Kafka**.',
        '- **API Gateway** como único punto de entrada: maneja auth, routing y rate limiting.',
        '- Health checks en cada servicio: `/health` (liveness) y `/ready` (readiness).',
        '- Correlation IDs en los headers para **distributed tracing**.',
        '- Cada servicio en su propio **Dockerfile**; orquesta con `docker-compose` en dev.',
        '',
      );
    } else if (config.arquitectura === 'Monolito modular') {
      lines.push(
        '#### Arquitectura — Monolito Modular\n',
        '- Un directorio por módulo de feature: `users/`, `products/`, `orders/`, etc.',
        '- Los módulos solo se comunican a través de sus **interfaces públicas** (index/barrel files).',
        '- `shared/` para utilidades, guards, interceptors y componentes transversales.',
        '- Respeta los límites de módulo: no importes archivos internos de otro módulo directamente.',
        '',
      );
    }

    return lines;
  }

  // ─────────────────────────────────────────────
  //  Generador de Prompt de Base de Datos
  // ─────────────────────────────────────────────

  generateDatabasePrompt(data: ProjectData, config: PromptConfig): string {
    const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const db = config.stackDatabase;
    const backend = config.stackBackend;
    const parts: string[] = [];

    const isRelational = ['PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'SQL Server'].some(d => db.includes(d));
    const isMongo = db.includes('MongoDB');
    const isFirebase = db.includes('Firebase') || db.includes('Firestore');

    parts.push('# Prompt de Base de Datos\n');
    parts.push(`> **Generado el:** ${date}  `);
    parts.push(`> **Proyecto:** ${data.proyecto.nombre}  `);
    parts.push(`> **Motor:** ${db || 'No definido'}  `);
    parts.push(`> **Backend:** ${backend || 'No definido'}\n`);
    parts.push('---\n');

    // ── Rol ──────────────────────────────────────────────────────────────
    parts.push('## Rol y Objetivo\n');
    if (isRelational) {
      parts.push(
        `Eres un experto en diseño de bases de datos relacionales con **${db}**. ` +
        `Tu tarea es diseñar e implementar el esquema de base de datos **completo, normalizado (3NF) y listo para producción** ` +
        `del proyecto **${data.proyecto.nombre}**. ` +
        `Incluye todas las tablas, columnas tipadas, restricciones, índices, relaciones con foreign keys, ` +
        `migraciones versionadas, seeds de datos iniciales y las entidades ORM para **${backend}**.\n`
      );
    } else if (isMongo) {
      parts.push(
        `Eres un experto en diseño de bases de datos con **MongoDB**. ` +
        `Tu tarea es diseñar los **schemas de Mongoose** completos del proyecto **${data.proyecto.nombre}**, ` +
        `con validaciones, índices, relaciones (embed vs. reference), agregaciones frecuentes y seeds de datos iniciales.\n`
      );
    } else if (isFirebase) {
      parts.push(
        `Eres un experto en **Cloud Firestore**. ` +
        `Tu tarea es diseñar la **estructura de colecciones** del proyecto **${data.proyecto.nombre}**, ` +
        `con reglas de seguridad, índices compuestos, estrategia de subcollecciones vs. colecciones raíz, ` +
        `y funciones Cloud Functions para lógica transaccional.\n`
      );
    } else {
      parts.push(
        `Eres un experto en diseño de bases de datos con **${db}**. ` +
        `Tu tarea es diseñar el esquema de base de datos completo del proyecto **${data.proyecto.nombre}**.\n`
      );
    }

    // ── Descripción del proyecto ──────────────────────────────────────────
    parts.push('## Descripción del Proyecto\n');
    parts.push(`${data.proyecto.descripcion}\n`);

    // ── Usuarios del sistema ──────────────────────────────────────────────
    if (data.stakeholders.length > 0) {
      parts.push('---\n');
      parts.push('## Roles de Usuario del Sistema\n');
      parts.push('Estos roles deben existir en la tabla/colección de usuarios con sus permisos diferenciados:\n');
      data.stakeholders.forEach(s => {
        parts.push(`- **${s.rol}** (${s.area || 'General'})${s.notas ? ` — ${s.notas}` : ''}`);
      });
      parts.push('');
    }

    // ── Procesos → entidades ──────────────────────────────────────────────
    if (data.procesos.length > 0) {
      parts.push('---\n');
      parts.push('## Procesos de Negocio → Entidades Inferidas\n');
      parts.push('Cada proceso implica entidades y operaciones CRUD que deben estar soportadas en la BD:\n');
      data.procesos.forEach((p, i) => {
        parts.push(`### ${i + 1}. ${p.nombre}\n`);
        parts.push(`- **Descripción:** ${p.descripcion}`);
        if (p.departamentos?.length) {
          parts.push(`- **Áreas involucradas:** ${p.departamentos.join(', ')}`);
        }
        if (p.pasos_clave?.length) {
          parts.push(`- **Flujo de datos:** ${p.pasos_clave.join(' → ')}`);
        }
        if (p.subprocesos?.length) {
          const entidades = p.subprocesos.map(sp => sp.nombre).join(', ');
          parts.push(`- **Posibles entidades:** ${entidades}`);
        }
        parts.push('');
      });
    }

    // ── Historias de usuario → campos y operaciones ───────────────────────
    if (data.historias.length > 0) {
      parts.push('---\n');
      parts.push('## Historias de Usuario → Operaciones de BD\n');
      parts.push('Cada historia define operaciones concretas (CREATE, READ, UPDATE, DELETE) que la BD debe soportar eficientemente:\n');
      data.historias.forEach((h, i) => {
        parts.push(`**HU-${String(i + 1).padStart(3, '0')}:** ${h.titulo_historia || 'Sin título'}`);
        if (h.rol && h.quiero) {
          parts.push(`> Como **${h.rol}** quiero **${h.quiero}**${h.para_que ? ` para **${h.para_que}**` : ''}.`);
        }
        if (h.criterios_aceptacion) {
          const criterios = h.criterios_aceptacion.split(/[;\n]/).map(c => c.trim()).filter(Boolean);
          criterios.forEach(c => parts.push(`- [ ] ${c}`));
        }
        parts.push('');
      });
    }

    // ── Diagramas de clases → entidades exactas ───────────────────────────
    const classDiagrams = data.diagramas.filter(d => d.tipo === 'clases');
    if (classDiagrams.length > 0) {
      parts.push('---\n');
      parts.push('## Diagramas de Clases → Estructura de Entidades\n');
      parts.push('Usa estos diagramas como la fuente de verdad para nombres de entidades, atributos y relaciones:\n');
      classDiagrams.forEach(d => {
        parts.push(`### ${d.nombre}${d.descripcion ? ` — ${d.descripcion}` : ''}\n`);
        if (d.nodes?.length) {
          d.nodes.forEach(n => {
            parts.push(`#### Entidad: \`${n.label}\`${n.stereotype ? ` «${n.stereotype}»` : ''}\n`);
            if (n.attributes?.length) {
              parts.push('**Atributos:**\n');
              n.attributes.forEach(a => parts.push(`- \`${a.text}\` (${a.visibility})`));
            }
            if (n.methods?.length) {
              parts.push('\n**Métodos (lógica relacionada con persistencia):**\n');
              n.methods.forEach(m => parts.push(`- \`${m.text}\``));
            }
            parts.push('');
          });
        }
        if (d.relations?.length) {
          parts.push('**Relaciones entre entidades:**\n');
          d.relations.forEach(r => {
            const src = d.nodes?.find(n => n.id === r.sourceId)?.label ?? r.sourceId;
            const tgt = d.nodes?.find(n => n.id === r.targetId)?.label ?? r.targetId;
            const lbl = r.label ? ` — "${r.label}"` : '';
            parts.push(`- \`${src}\` --[**${r.kind}**]--> \`${tgt}\`${lbl}`);
          });
          parts.push('');
        }
      });
    }

    // ── Hallazgos de documentos ───────────────────────────────────────────
    if (data.documentos.length > 0) {
      parts.push('---\n');
      parts.push('## Hallazgos de Documentos Relevantes para la BD\n');
      data.documentos.forEach((d, i) => {
        if (!d.hallazgos?.length && !d.recomendaciones) return;
        parts.push(`### ${d.titulo} (${d.tipoDocumento})\n`);
        if (d.hallazgos?.length) {
          d.hallazgos.forEach(h => parts.push(`- ${h}`));
        }
        if (d.recomendaciones) {
          parts.push(`\n> **Recomendaciones:** ${d.recomendaciones}`);
        }
        parts.push('');
      });
    }

    // ── Reglas de integridad de criterios de aceptación ─────────────────────
    if (data.historias.length > 0) {
      const integrityRules: string[] = [];
      data.historias.forEach((h, i) => {
        if (!h.criterios_aceptacion) return;
        const criterios = h.criterios_aceptacion.split(/[;\n]/).map(c => c.trim()).filter(c => c.length > 0);
        const dbRelevant = criterios.filter(c => {
          const lower = c.toLowerCase();
          return lower.includes('único') || lower.includes('unico') || lower.includes('obligatori') ||
            lower.includes('no puede') || lower.includes('no debe') || lower.includes('máximo') ||
            lower.includes('mínimo') || lower.includes('formato') || lower.includes('válid') ||
            lower.includes('requerid') || lower.includes('no nulo') || lower.includes('not null') ||
            lower.includes('por defecto') || lower.includes('default') || lower.includes('cascad') ||
            lower.includes('relación') || lower.includes('referencia') || lower.includes('depend');
        });
        if (dbRelevant.length > 0) {
          integrityRules.push(`**HU-${String(i + 1).padStart(3, '0')}** (${h.titulo_historia || 'Sin título'}):`);
          dbRelevant.forEach(r => integrityRules.push(`  - ${r}`));
        }
      });

      if (integrityRules.length > 0) {
        parts.push('---\n');
        parts.push('## ✅ Reglas de Integridad de Datos\n');
        parts.push('Las siguientes reglas fueron extraídas de los criterios de aceptación y deben implementarse como **constraints en la BD** ' +
          '(CHECK, UNIQUE, NOT NULL, DEFAULT, triggers):\n');
        integrityRules.forEach(r => parts.push(r));
        parts.push('');
      }
    }

    // ── Estimación de volúmenes ────────────────────────────────────────────
    {
      const volumeEstimates: string[] = [];
      if (data.stakeholders.length > 0) {
        const roles = new Set(data.stakeholders.map(s => s.rol));
        volumeEstimates.push(`- **Roles de usuario:** ${roles.size} roles distintos (${Array.from(roles).join(', ')})`);
        volumeEstimates.push(`- **Stakeholders registrados:** ${data.stakeholders.length}`);
      }
      if (data.procesos.length > 0) {
        const totalSubprocesos = data.procesos.reduce((acc, p) => acc + (p.subprocesos?.length || 0), 0);
        volumeEstimates.push(`- **Procesos de negocio:** ${data.procesos.length} procesos, ${totalSubprocesos} subprocesos`);
      }
      if (data.encuestas.length > 0) {
        const totalParticipantes = data.encuestas.reduce((acc, e) => acc + (e.numero_participantes_esperados || 0), 0);
        if (totalParticipantes > 0) {
          volumeEstimates.push(`- **Participantes de encuestas:** ~${totalParticipantes} (referencia para dimensionar tablas de usuarios/respuestas)`);
        }
      }
      if (data.historias.length > 0) {
        volumeEstimates.push(`- **Historias de usuario:** ${data.historias.length} (referencia para módulos/tablas del sistema)`);
      }
      const classDiags = data.diagramas.filter(d2 => d2.tipo === 'clases');
      if (classDiags.length > 0) {
        const totalEntities = classDiags.reduce((acc, d2) => acc + (d2.nodes?.filter(n => n.kind === 'class' || n.kind === 'abstract').length || 0), 0);
        volumeEstimates.push(`- **Entidades identificadas:** ${totalEntities} (del diagrama de clases)`);
      }

      if (volumeEstimates.length > 0) {
        parts.push('---\n');
        parts.push('## 📊 Estimación de Volúmenes\n');
        parts.push('Usa estos datos como referencia para dimensionar índices, particiones y estrategias de paginación:\n');
        volumeEstimates.forEach(v => parts.push(v));
        parts.push('');
      }
    }

    // ── Instrucciones técnicas ────────────────────────────────────────────
    parts.push('---\n');
    parts.push('## Instrucciones Técnicas\n');

    const dbInstructions = this.getDatabaseInstructions(db, backend, config.arquitectura);
    dbInstructions.forEach(line => parts.push(line));

    // ── Entregables ───────────────────────────────────────────────────────
    parts.push('---\n');
    parts.push('## Entregables — Orden de Generación\n');

    if (isRelational) {
      parts.push('Genera los entregables en este orden:\n');
      parts.push('1. **Diagrama ER** — descripción textual de todas las entidades y sus relaciones.');
      parts.push('2. **Esquema SQL completo** — `CREATE TABLE` con tipos, `NOT NULL`, `DEFAULT`, `CHECK`, `UNIQUE`.');
      parts.push('3. **Foreign keys y constraints** — `ALTER TABLE ... ADD CONSTRAINT ...`.');
      parts.push('4. **Índices** — `CREATE INDEX` para todas las columnas de búsqueda frecuente.');
      parts.push('5. **Entidades ORM** — clases con decoradores para ' + backend + '.');
      parts.push('6. **Migraciones** — archivos de migración versionados y su rollback.');
      parts.push('7. **Seeds** — datos iniciales para roles, usuarios admin y catálogos del sistema.');
      parts.push('8. **Queries frecuentes** — las 5–10 consultas más usadas por la aplicación.');
    } else if (isMongo) {
      parts.push('Genera los entregables en este orden:\n');
      parts.push('1. **Mapa de colecciones** — todas las colecciones y su estrategia embed/reference.');
      parts.push('2. **Schemas de Mongoose** — con tipos, validaciones, virtuals y métodos.');
      parts.push('3. **Índices** — `schema.index()` para todos los campos de búsqueda.');
      parts.push('4. **Aggregation pipelines** — para las consultas complejas del sistema.');
      parts.push('5. **Seeds** — datos iniciales para desarrollo y testing.');
      parts.push('6. **Queries frecuentes** — ejemplos de las operaciones más comunes.');
    } else if (isFirebase) {
      parts.push('Genera los entregables en este orden:\n');
      parts.push('1. **Mapa de colecciones** — estructura de colecciones y subcollecciones.');
      parts.push('2. **Interfaces TypeScript** — tipos para cada documento.');
      parts.push('3. **Reglas de seguridad** — `firestore.rules` completo por rol de usuario.');
      parts.push('4. **Índices compuestos** — `firestore.indexes.json`.');
      parts.push('5. **Cloud Functions** — para operaciones atómicas y triggers.');
      parts.push('6. **Seeds** — script de carga inicial de datos.');
    }
    parts.push('');

    parts.push('---\n');
    parts.push(
      '> **Importante:** Genera primero el diagrama ER y espera confirmación antes de continuar. ' +
      'Cada tabla/colección debe incluir: campo de **auditoría** (`created_at`, `updated_at`, `deleted_at` para soft delete), ' +
      '**UUID o ID auto-incremental** según la arquitectura, y **versionado** si aplica. ' +
      '**Prioriza la integridad referencial y el rendimiento en consultas de lectura.**\n'
    );
    parts.push('> 📌 **Este prompt tiene prompts complementarios para Código Fuente y Diseño UI/UX** generados a partir de los mismos datos.\n');

    return parts.join('\n');
  }

  private getDatabaseInstructions(db: string, backend: string, arquitectura: string): string[] {
    const lines: string[] = [];

    // ── Instrucciones específicas por motor ───────────────────────────────
    if (db.includes('PostgreSQL')) {
      lines.push(
        '### Motor — PostgreSQL\n',
        '- Usa tipos nativos apropiados: `UUID` (PK), `VARCHAR(n)`, `TEXT`, `INTEGER`, `BIGINT`, `DECIMAL(p,s)`, `BOOLEAN`, `TIMESTAMPTZ`, `JSONB`, `ARRAY`.',
        '- **UUID v4** como PK con `DEFAULT gen_random_uuid()` (extensión `pgcrypto`).',
        '- **Soft delete** con columna `deleted_at TIMESTAMPTZ DEFAULT NULL` y vistas filtradas.',
        '- **Auditoría** con `created_at TIMESTAMPTZ DEFAULT NOW()` y `updated_at` actualizado por trigger.',
        '- Usa **enums** de PostgreSQL para estados finitos (p. ej. `CREATE TYPE estado_enum AS ENUM (...)`).',
        '- `JSONB` para datos semiestructurados; indexa con `GIN` si se busca dentro del JSON.',
        '- Usa `GENERATED ALWAYS AS IDENTITY` para IDs numéricos alternativos.',
        '- Activa las extensiones necesarias: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.',
        '',
      );
    } else if (db.includes('MySQL') || db.includes('MariaDB')) {
      lines.push(
        `### Motor — ${db}\n`,
        '- Motor de tablas: **InnoDB** (obligatorio para foreign keys y transacciones).',
        '- Charset global: `utf8mb4`, collation `utf8mb4_unicode_ci`.',
        '- **UUID** como PK: almacena en `CHAR(36)` o `BINARY(16)` para eficiencia.',
        '- Columnas de auditoría: `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.',
        '- **Soft delete** con `deleted_at DATETIME DEFAULT NULL`.',
        '- Usa `ENUM` para estados con valores fijos y pocos posibles valores.',
        '- Índice compuesto para las búsquedas más frecuentes; evita `SELECT *` en producción.',
        '',
      );
    } else if (db.includes('SQL Server')) {
      lines.push(
        '### Motor — SQL Server\n',
        '- PKs con `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()` (mejor rendimiento que `NEWID()`).',
        '- Columnas de auditoría: `CreatedAt DATETIME2 DEFAULT GETUTCDATE()`, `UpdatedAt DATETIME2`.',
        '- **Soft delete** con `DeletedAt DATETIME2 NULL`.',
        '- Usa `NVARCHAR(MAX)` para texto largo; `NVARCHAR(n)` para campos acotados.',
        '- Habilita **Row-Level Security** para control de acceso a filas por rol.',
        '- Índices **columnstore** para tablas de reporte/analítica.',
        '',
      );
    } else if (db.includes('SQLite')) {
      lines.push(
        '### Motor — SQLite\n',
        '- Usa tipos de afinidad: `INTEGER`, `REAL`, `TEXT`, `BLOB`.',
        '- PKs: `INTEGER PRIMARY KEY AUTOINCREMENT` o `TEXT` para UUID.',
        '- Activa foreign keys: `PRAGMA foreign_keys = ON;` al inicio de cada conexión.',
        '- Columnas de auditoría con `DATETIME DEFAULT (datetime(\'now\',\'utc\'))`.',
        '- Apropiado para desarrollo local; considera migrar a PostgreSQL/MySQL en producción.',
        '',
      );
    } else if (db.includes('MongoDB')) {
      lines.push(
        '### Motor — MongoDB con Mongoose\n',
        '- Usa `mongoose.Schema` con `{ timestamps: true }` para `createdAt`/`updatedAt` automáticos.',
        '- PKs: `_id` de Mongoose (ObjectId) — no re-crees uno propio salvo necesidad específica.',
        '- **Soft delete**: campo `deletedAt: { type: Date, default: null }` + middleware de query.',
        '- `ref` para referencias entre colecciones; embed para subdocumentos que no se consultan solos.',
        '- Define todos los tipos explícitamente; evita `Schema.Types.Mixed` salvo para datos realmente dinámicos.',
        '- Versiona documentos con `__v` (Mongoose lo gestiona) o con campo `version` propio para concurrencia optimista.',
        '',
      );
    } else if (db.includes('Firebase') || db.includes('Firestore')) {
      lines.push(
        '### Motor — Cloud Firestore\n',
        '- Diseña colecciones orientadas a las **consultas**, no al modelo relacional.',
        '- Subcollecciones para datos que siempre se leen con el documento padre.',
        '- Colecciones raíz para entidades que se consultan de forma independiente.',
        '- Desnormalización controlada: duplica campos que se leen frecuentemente para evitar joins.',
        '- **Batch writes** para operaciones que afectan múltiples documentos atomicamente.',
        '- Reglas de seguridad granulares: nunca uses `allow read, write: if true;` en producción.',
        '- Todos los documentos con campos de auditoría: `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()`.',
        '',
      );
    }

    // ── ORM específico por backend ────────────────────────────────────────
    if (backend.includes('NestJS') || backend.includes('Express')) {
      if (db.includes('MongoDB')) {
        lines.push(
          '### ORM — Mongoose + NestJS\n',
          '- Usa `@nestjs/mongoose` con decoradores: `@Schema()`, `@Prop()`, `@InjectModel()`.',
          '- Define `SchemaFactory.createForClass(Entity)` en el módulo.',
          '- Usa `HydratedDocument<Entity>` como tipo de retorno en los servicios.',
          '- Registra el modelo en el módulo con `MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])`.',
          '',
        );
      } else {
        lines.push(
          '### ORM — TypeORM + NestJS\n',
          '- Entidades con `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn(\'uuid\')`, `@CreateDateColumn()`, `@UpdateDateColumn()`, `@DeleteDateColumn()`.',
          '- Relaciones: `@OneToMany()`, `@ManyToOne()`, `@ManyToMany()` con `@JoinColumn()` / `@JoinTable()`.',
          '- `@Index()` en columnas de búsqueda frecuente directamente en la entidad.',
          '- Repositorios inyectados con `@InjectRepository(Entity)`.',
          '- Migraciones con `TypeORM CLI`: `npm run migration:generate` y `migration:run`.',
          '- Configura `synchronize: false` en producción; usa solo migraciones.',
          '',
        );
      }
    } else if (backend.includes('Spring Boot')) {
      lines.push(
        '### ORM — Spring Data JPA\n',
        '- Entidades con `@Entity`, `@Table(name = "...")`, `@Id`, `@GeneratedValue(strategy = GenerationType.UUID)`.',
        '- Auditoría con `@CreatedDate`, `@LastModifiedDate` y `@EntityListeners(AuditingEntityListener.class)`.',
        '- Activa auditoría con `@EnableJpaAuditing` en la clase de configuración.',
        '- Relaciones: `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)`, `@ManyToOne(fetch = FetchType.LAZY)`.',
        '- `@Column(nullable = false, length = 255)` en todos los campos obligatorios.',
        '- Usa **Flyway** o **Liquibase** para migraciones versionadas.',
        '',
      );
    } else if (backend.includes('Django')) {
      lines.push(
        '### ORM — Django ORM\n',
        '- Modelos con campos tipados: `CharField`, `TextField`, `IntegerField`, `DecimalField`, `DateTimeField`, `BooleanField`, `UUIDField`.',
        '- Usa `auto_now_add=True` para `created_at` y `auto_now=True` para `updated_at`.',
        '- **Soft delete**: override de `QuerySet` con `Manager` personalizado y campo `deleted_at`.',
        '- Relaciones: `ForeignKey(..., on_delete=models.CASCADE)`, `ManyToManyField`, `OneToOneField`.',
        '- `class Meta: indexes = [models.Index(fields=[...])]` para índices.',
        '- Migraciones con `python manage.py makemigrations && migrate`.',
        '',
      );
    } else if (backend.includes('Laravel')) {
      lines.push(
        '### ORM — Eloquent (Laravel)\n',
        '- Usa `$fillable` o `$guarded` en todos los modelos; nunca dejes `$guarded = []` en producción.',
        '- Timestamps automáticos con `$timestamps = true` (default); `SoftDeletes` trait para soft delete.',
        '- Relaciones: `hasMany`, `belongsTo`, `belongsToMany`, `hasOne` con método nombrado.',
        '- Migraciones en `database/migrations/` con `up()` y `down()` para rollback.',
        '- Seeders en `database/seeders/` con `DatabaseSeeder` como punto de entrada.',
        '- Usa `$casts` para tipos: `\'uuid\' => \'string\'`, `\'metadata\' => \'array\'`, `\'is_active\' => \'boolean\'`.',
        '',
      );
    } else if (backend.includes('FastAPI')) {
      lines.push(
        '### ORM — SQLAlchemy 2.0 (FastAPI)\n',
        '- Usa la API declarativa con `DeclarativeBase` y `Mapped[T]` con `mapped_column()`.',
        '- PKs: `Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)`.',
        '- Auditoría: `created_at: Mapped[datetime] = mapped_column(default=func.now())`, `updated_at` con `onupdate=func.now()`.',
        '- Relaciones: `relationship()` con `back_populates` y `lazy="selectin"` para async.',
        '- Migraciones con **Alembic**: `alembic revision --autogenerate` y `alembic upgrade head`.',
        '- Sesiones async con `AsyncSession` e inyectadas via `Depends(get_db)`.',
        '',
      );
    }

    // ── Buenas prácticas de BD ────────────────────────────────────────────
    lines.push(
      '### Buenas Prácticas de Base de Datos\n',
      '- **Normalización (3NF)** en bases relacionales: elimina redundancia y anomalías de actualización.',
      '- **Índices:** crea índices en todas las FKs, columnas de búsqueda y columnas de ordenamiento frecuente.',
      '- **Transacciones:** usa transacciones para operaciones que afectan múltiples tablas/colecciones.',
      '- **Passwords:** almacena solo el hash (bcrypt, costo ≥ 12); nunca texto plano ni MD5/SHA1.',
      '- **Datos sensibles:** cifra con AES-256 campos PII (número de documento, teléfono, etc.).',
      '- **Soft delete** en lugar de `DELETE` físico para mantener historial e integridad referencial.',
      '- **Paginación en BD:** usa `LIMIT/OFFSET` (o `FETCH NEXT`) con índice en columna de orden.',
      '- **Evita SELECT \\*:** selecciona solo las columnas necesarias en queries de producción.',
      '- **Variables de entorno:** credenciales de BD en `.env`; nunca hardcodeadas.',
      '- **Backups:** documenta la estrategia de backup y punto de recuperación (RTO/RPO).',
      '',
    );

    // ── Consideraciones por arquitectura ─────────────────────────────────
    if (arquitectura === 'Microservicios') {
      lines.push(
        '### Consideraciones — Arquitectura de Microservicios\n',
        '- **Database per Service:** cada microservicio tiene su propia BD; nunca comparten esquema.',
        '- **Sagas** (coreografía o orquestación) para transacciones distribuidas entre servicios.',
        '- **Eventos de dominio** publicados a la BD de eventos (o message broker) tras cada cambio de estado.',
        '- Evita JOINs entre bases de datos; desnormaliza o usa vistas materializadas.',
        '',
      );
    }

    return lines;
  }

  // ─────────────────────────────────────────────
  //  Generador de Prompt de Diseño
  // ─────────────────────────────────────────────

  generateDesignPrompt(data: ProjectData, config: PromptConfig): string {
    const d = config.design;
    const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const parts: string[] = [];

    parts.push('# Prompt de Diseño UI/UX\n');
    parts.push(`> **Generado el:** ${date}  `);
    parts.push(`> **Proyecto:** ${data.proyecto.nombre}  `);
    parts.push(`> **Framework UI:** ${d.uiFramework || 'No definido'}  `);
    parts.push(`> **Estilo:** ${d.designStyle || 'No definido'}  `);
    parts.push(`> **Frontend:** ${config.stackFrontend || 'No definido'}\n`);
    parts.push('---\n');

    parts.push('## Rol y Objetivo\n');
    parts.push(
      `Eres un **experto en diseño de interfaces de usuario (UI/UX)** con amplia experiencia en aplicaciones empresariales. ` +
      `Tu tarea es diseñar e implementar la interfaz completa de **${data.proyecto.nombre}** ` +
      `usando **${d.uiFramework || 'el framework indicado'}** sobre **${config.stackFrontend}**. ` +
      `El resultado debe ser código funcional, estético, accesible y con excelente experiencia de usuario.\n`
    );
    parts.push('> **📌 Nota:** Este prompt tiene prompts complementarios para **Código Fuente** y **Base de Datos** ' +
      'generados a partir de los mismos datos. Si los recibes, úsalos como referencia cruzada para entidades y endpoints.\n');

    parts.push('## Descripción del Proyecto\n');
    parts.push(`${data.proyecto.descripcion}\n`);

    if (data.stakeholders.length > 0) {
      parts.push('## Usuarios de la Aplicación\n');
      parts.push('Diseña la interfaz considerando los diferentes perfiles de usuario y sus necesidades:\n');
      data.stakeholders.forEach(s => {
        parts.push(`- **${s.nombre}** — Rol: ${s.rol}, Área: ${s.area}${s.notas ? ` (${s.notas})` : ''}`);
      });
      parts.push('');
    }

    // ── Módulos de Navegación (derivados de procesos) ──────────────────────
    if (data.procesos.length > 0) {
      parts.push('---\n');
      parts.push('## 🗂️ Módulos de Navegación\n');
      parts.push('Cada proceso de negocio se traduce en un módulo o sección del menú de navegación:\n');
      data.procesos.forEach((p, i) => {
        parts.push(`### ${i + 1}. ${p.nombre}\n`);
        parts.push(`- **Descripción:** ${p.descripcion}`);
        if (p.subprocesos?.length) {
          parts.push(`- **Submenús / Subvistas:**`);
          p.subprocesos.forEach(sp => {
            parts.push(`  - ${sp.nombre}: ${sp.descripcion || '—'}`);
          });
        }
        parts.push('');
      });
    }

    // ── Flujos de usuario (derivados de casos de uso) ──────────────────────
    const flujos = this.buildFlujosUsuarioSection(data);
    if (flujos) parts.push('---\n', flujos);

    if (data.historias.length > 0) {
      parts.push('---\n');
      parts.push('## 📱 Vistas / Pantallas Requeridas\n');
      parts.push('Diseña una vista por cada historia de usuario. Cada vista debe ser funcional, responsive y coherente con el sistema de diseño.\n');
      data.historias.forEach((h, i) => {
        parts.push(`### Vista ${String(i + 1).padStart(2, '0')}: ${h.titulo_historia || 'Sin título'}`);
        if (h.rol && h.quiero) {
          parts.push(`> Como **${h.rol}**, quiero **${h.quiero}**${h.para_que ? `, para **${h.para_que}**` : ''}.`);
        }

        // Generar wireframe textual
        parts.push('\n**Wireframe sugerido:**\n');
        if (h.quiero) {
          const action = h.quiero.toLowerCase();
          if (action.includes('ver') || action.includes('listar') || action.includes('consultar') || action.includes('buscar')) {
            parts.push('- Barra de búsqueda/filtros en la parte superior');
            parts.push('- Tabla de datos o grid de cards con los registros');
            parts.push('- Paginación en la parte inferior');
            parts.push('- Botón de acción principal (crear nuevo) en esquina superior derecha');
          } else if (action.includes('crear') || action.includes('registrar') || action.includes('agregar') || action.includes('añadir')) {
            parts.push('- Formulario con los campos necesarios agrupados por sección');
            parts.push('- Validación en tiempo real con mensajes inline');
            parts.push('- Botones: Guardar (primario) y Cancelar (secundario)');
            parts.push('- Indicador de campos obligatorios (*)');
          } else if (action.includes('editar') || action.includes('modificar') || action.includes('actualizar')) {
            parts.push('- Formulario pre-poblado con los datos actuales');
            parts.push('- Indicador visual de campos modificados');
            parts.push('- Botones: Guardar cambios (primario) y Cancelar (secundario)');
          } else if (action.includes('eliminar') || action.includes('borrar')) {
            parts.push('- Modal de confirmación con mensaje descriptivo');
            parts.push('- Indicador del elemento a eliminar');
            parts.push('- Botones: Eliminar (destructivo/rojo) y Cancelar');
          } else if (action.includes('reporte') || action.includes('dashboard') || action.includes('estadística') || action.includes('resumen')) {
            parts.push('- KPI cards en la parte superior con métricas principales');
            parts.push('- Gráficos/charts relevantes');
            parts.push('- Filtros por fecha/período');
            parts.push('- Opción de exportar/descargar');
          } else {
            parts.push('- Layout apropiado para la funcionalidad descrita');
            parts.push('- Feedback visual para cada acción del usuario');
          }
        }

        if (h.criterios_aceptacion) {
          parts.push('\n**Criterios de UX:**\n');
          const criterios = h.criterios_aceptacion.split(/[;\n]/).map(c => c.trim()).filter(Boolean);
          criterios.forEach(c => parts.push(`- [ ] ${c}`));
        }
        parts.push('');
      });
    }

    parts.push('---\n');
    parts.push('## 🎨 Especificaciones de Diseño\n');

    parts.push('### Sistema Visual\n');
    parts.push(`| Propiedad | Valor |`);
    parts.push(`|-----------|-------|`);
    parts.push(`| Framework UI | ${d.uiFramework || '—'} |`);
    parts.push(`| Estilo visual | ${d.designStyle || '—'} |`);
    parts.push(`| Color principal | ${d.colorPrimary || '—'} |`);
    parts.push(`| Modo | ${d.darkMode ? 'Dark Mode' : 'Light Mode'} |`);
    parts.push(`| Layout | ${d.layoutType || '—'} |`);
    parts.push(`| Frontend | ${config.stackFrontend || '—'} |`);
    parts.push('');

    parts.push('### Layout y Navegación\n');
    parts.push(`- Implementa el layout: **${d.layoutType || 'Sidebar + Contenido Principal'}**.`);
    parts.push('- Navegación con indicador visual de sección activa.');
    parts.push('- Breadcrumbs en vistas con navegación profunda.');
    parts.push('- Diseño completamente **responsivo** (mobile-first: sm 640px, md 768px, lg 1024px, xl 1280px).');
    parts.push('- Transiciones suaves entre vistas (fade o slide).');
    parts.push('');

    const fwInstructions = this.getFrameworkDesignInstructions(d.uiFramework, config.stackFrontend);
    if (fwInstructions.length > 0) {
      parts.push('### Instrucciones del Framework UI\n');
      fwInstructions.forEach(line => parts.push(line));
      parts.push('');
    }

    parts.push('### Principios de Diseño Obligatorios\n');
    parts.push('- **Consistencia:** sistema de diseño unificado (spacing, paleta, tipografía).');
    parts.push('- **Accesibilidad (WCAG 2.1 AA):** contraste ≥ 4.5:1, soporte de teclado, `aria-*` labels.');
    parts.push('- **Feedback visual:** loaders, estados vacíos (empty state), mensajes de error y éxito.');
    parts.push('- **Tipografía:** máx. 2 familias; escala clara (h1→h6, body, caption, label).');
    parts.push('- **Micro-interacciones:** transiciones de 0.15–0.25s ease en hover, focus y navegación.');
    parts.push('- **Estados de carga:** Skeleton loaders o spinners en todas las vistas que cargan datos.');
    parts.push('- **Empty states:** Ilustración + mensaje + CTA cuando no hay datos.');
    parts.push('- **Error states:** Mensajes claros con opción de reintentar.');
    parts.push('');

    parts.push('### Componentes Reutilizables Requeridos\n');
    parts.push('- **Navbar / Sidebar:** logo, menú de navegación, perfil de usuario, logout.');
    parts.push('- **Tablas de datos:** paginación, búsqueda, ordenamiento y acciones por fila.');
    parts.push('- **Formularios:** validación en tiempo real, mensajes de error inline, estados de carga.');
    parts.push('- **Cards:** para mostrar resúmenes con acciones (ver, editar, eliminar).');
    parts.push('- **Modales / Dialogs:** para confirmar acciones destructivas y formularios secundarios.');
    parts.push('- **Badges de estado:** activo, inactivo, pendiente, completado.');
    parts.push('- **Toast / Snackbar:** para confirmar operaciones CRUD.');
    parts.push('- **Dashboard / Overview:** KPI cards con métricas clave del proyecto.');
    parts.push('- **Skeleton loaders:** para cada tipo de contenido (tabla, card, form).');
    parts.push('');

    if (d.notasDiseno) {
      parts.push('### Notas Adicionales\n');
      parts.push(d.notasDiseno);
      parts.push('');
    }

    parts.push('---\n');
    parts.push('## Orden de Entregables\n');
    parts.push('1. **Tokens de diseño** — variables CSS / tokens del framework (colores, spacing, tipografía, sombras).');
    parts.push('2. **Layout principal** — estructura de navegación y contenedor de páginas.');
    parts.push('3. **Componentes compartidos** — navbar/sidebar, footer, loaders, empty states, toasts.');
    parts.push('4. **Vista por vista** — una por cada historia de usuario listada arriba.');
    parts.push('5. **Formularios** — con validación y feedback visual completo.');
    parts.push('6. **Guía de estilos** — decisiones de diseño documentadas (colores, tipografía, espaciado).');
    parts.push('');
    parts.push('> **Recuerda:** Diseña primero en **mobile**, luego adapta a tablet y desktop. ' +
      'Prioriza la **usabilidad** sobre el impacto visual. Cada componente debe ser accesible por teclado.\n');
    parts.push('> 📌 **Este prompt tiene prompts complementarios para Código Fuente y Base de Datos** generados a partir de los mismos datos.\n');

    return parts.join('\n');
  }

  private getFrameworkDesignInstructions(uiFramework: string, frontend: string): string[] {
    const lines: string[] = [];

    if (uiFramework.includes('Tailwind')) {
      lines.push(
        '- Usa **utility classes de Tailwind** directamente en los templates.',
        '- Define `tailwind.config.js` con los colores, fuentes y breakpoints del proyecto.',
        '- Usa `@apply` en CSS solo para componentes muy repetidos.',
        '- Instala **tailwind-merge** (`twMerge` / `cn()`) para combinar clases dinámicamente.',
        `- ${frontend.includes('React') || frontend.includes('Next') ? 'Considera **shadcn/ui** como capa de componentes sobre Tailwind.' : frontend.includes('Angular') ? 'Considera **DaisyUI** o construye los componentes manualmente.' : 'Considera **DaisyUI** como capa de componentes sobre Tailwind.'}`,
      );
    } else if (uiFramework.includes('Angular Material')) {
      lines.push(
        '- Define un **custom theme** con `mat.define-theme()` en `styles.scss`.',
        '- Usa `MatToolbarModule`, `MatSidenavModule`, `MatTableModule`, `MatFormFieldModule`, `MatButtonModule`.',
        '- Implementa el **CDK** para drag-and-drop, virtual scroll y portals.',
        '- `MatSnackBarModule` para notificaciones; `MatDialogModule` para confirmaciones.',
        '- Aprovecha `MatPaginatorModule` y `MatSortModule` en todas las tablas.',
      );
    } else if (uiFramework.includes('PrimeNG')) {
      lines.push(
        '- Configura el preset de tema (e.g., `Aura`) en `app.config.ts` con `providePrimeNG`.',
        '- Usa `p-table` con `lazy` para tablas con paginación server-side.',
        '- `p-toast` + `MessageService` para notificaciones globales.',
        '- `p-confirmDialog` + `ConfirmationService` para acciones destructivas.',
        '- Define los tokens de color en el objeto `theme.preset` para consistencia.',
      );
    } else if (uiFramework.includes('Bootstrap')) {
      lines.push(
        '- Sobreescribe las variables SCSS de Bootstrap en `_variables.scss` antes del import.',
        '- Usa el **grid system** (`row`/`col-*`) y utilidades de spacing (`m-*`, `p-*`, `gap-*`).',
        '- Usa los componentes nativos Bootstrap 5: `modal`, `offcanvas`, `toast`, `dropdown`.',
        '- Evita jQuery; usa la **API JS de Bootstrap 5** o `ng-bootstrap` para Angular.',
        '- Importa solo los módulos SCSS que necesitas (tree-shaking).',
      );
    } else if (uiFramework.includes('Chakra')) {
      lines.push(
        '- Envuelve la app con `<ChakraProvider theme={theme}>` en el root.',
        '- Personaliza con `extendTheme({ colors, fonts, components })`.',
        '- Usa los tokens de layout: `<Box>`, `<Flex>`, `<Grid>`, `<Stack>`, `<VStack>`, `<HStack>`.',
        '- Modo claro/oscuro con `useColorMode` y `useColorModeValue`.',
        '- `useToast` para notificaciones; `useDisclosure` para modales.',
      );
    } else if (uiFramework.includes('shadcn')) {
      lines.push(
        '- Instala componentes individualmente: `npx shadcn@latest add [component]`.',
        '- Los componentes viven en `components/ui/`; modifícalos libremente.',
        '- Usa `cn()` de `lib/utils` (combina `clsx` + `tailwind-merge`) para clases dinámicas.',
        '- Integra **Lucide React** para iconografía consistente.',
        '- Usa `<Toaster>` de `sonner` para notificaciones.',
      );
    } else if (uiFramework.includes('Vuetify')) {
      lines.push(
        '- Configura el plugin en `main.ts`: `createVuetify({ theme: { themes: { light: {...} } } })`.',
        '- Usa el grid de Vuetify: `v-container`, `v-row`, `v-col`.',
        '- `v-data-table` con `server-items-length` para tablas con paginación server-side.',
        '- `v-snackbar` para notificaciones; `v-dialog` para confirmaciones.',
        '- Usa los **Vuetify composables** (`useDisplay`, `useTheme`) para breakpoints y temas.',
      );
    }

    return lines;
  }
}