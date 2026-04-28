import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { StakeholderApiService, Stakeholder } from '../../services/stakeholder-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';
import { HerramientaApiService } from '../../services/herramienta-api.service';
import { EncuestaApiService, Encuesta, RespuestaEncuesta } from '../../services/Encuesta-api.service';
import { EntrevistaApiService, Entrevista } from '../../services/Entrevista-api.service';
import { HistoriaUsuarioApiService, HistoriaUsuario, UpdateHistoriaUsuarioDto } from '../../services/HistoriasUsuario-api.service';
import { FocusGroupApiService } from '../../services/FocusGroup.service';
import type { FocusGroup } from '../../services/FocusGroup.service';

interface ColorOption {
  valor: string;
  hex: string;
  gradient: string;
}

export interface HerramientaOpcion {
  id: string;
  nombre: string;
  detalle?: string;
}

export type TipoHerramienta =
  | 'encuesta'
  | 'entrevista'
  | 'documento'
  | 'focus_group'
  | 'historia_usuario'
  | 'observacion'
  | 'seguimiento';

interface TipoHerramientaConfig {
  valor: TipoHerramienta;
  label: string;
  icono: string;
}

@Component({
  selector: 'app-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent, ConfirmModalComponent],
  templateUrl: './procesos.component.html',
  styleUrls: ['./procesos.component.css']
})
export class ProcesosComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
  procesos: Proceso[] = [];
  stakeholders: Stakeholder[] = [];
  showForm = false;

  // Form fields
  nombre = '';
  descripcion = '';
  color = 'blue';
  stakeholder_id = '';
  departamentos: string[] = [];
  pasos_clave: string[] = [];
  nuevoDepartamento = '';
  nuevoPaso = '';

  // Subproceso inline form
  addingSubprocesoToId: string | null = null;
  addingSubprocesoModal = false;
  subNombre = '';
  subDescripcion = '';
  subStakeholderId = '';

  // ===== HERRAMIENTAS =====
  subTipoHerramienta: TipoHerramienta | '' = '';
  subHerramientaId = '';
  herramientasDisponibles: HerramientaOpcion[] = [];
  loadingHerramientas = false;

  readonly TIPOS_HERRAMIENTA: TipoHerramientaConfig[] = [
    {
      valor: 'encuesta', label: 'Encuesta',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>`
    },
    {
      valor: 'entrevista', label: 'Entrevista',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>`
    },
    {
      valor: 'documento', label: 'Documento',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>`
    },
    {
      valor: 'focus_group', label: 'Focus Group',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4"/><path d="M5.5 20a9 9 0 0 1 13 0"/>
        <circle cx="5" cy="14" r="3"/><circle cx="19" cy="14" r="3"/>
      </svg>`
    },
    {
      valor: 'historia_usuario', label: 'Historia',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`
    },
    {
      valor: 'observacion', label: 'Observación',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>`
    },
    {
      valor: 'seguimiento', label: 'Seguimiento',
      icono: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>`
    },
  ];

  // ===== MODAL ENCUESTA =====
  encuestaModal = false;
  loadingEncuesta = false;
  encuestaDetalle: Encuesta | null = null;
  encuestaSubprocesoId: string = '';
  encuestaSubprocesoNombre: string = '';
  respuestasMap: Record<number, string> = {};
  savingRespuestas = false;
  encuestaGuardada = false;

  // ===== MODAL ENTREVISTA =====
  entrevistaModal = false;
  loadingEntrevista = false;
  entrevistaDetalle: Entrevista | null = null;
  entrevistaSubprocesoId: string = '';
  entrevistaSubprocesoNombre: string = '';
  respuestasEntrevistaMap: Record<number, string> = {};
  savingRespuestasEntrevista = false;
  entrevistaGuardada = false;

  // ===== MODAL HISTORIA DE USUARIO =====
  historiaModal = false;
  loadingHistoria = false;
  historiaDetalle: HistoriaUsuario | null = null;
  historiaSubprocesoNombre: string = '';
  savingHistoria = false;
  historiaGuardada = false;
  historiaReadOnly = false;
  historiaForm = {
    titulo_historia: '',
    rol: '',
    quiero: '',
    para_que: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    estimacion: '',
    criterios_aceptacion: [''],
  };

  // ===== MODAL FOCUS GROUP =====
  focusGroupModal = false;
  loadingFocusGroup = false;
  focusGroupDetalle: FocusGroup | null = null;
  focusGroupSubprocesoNombre: string = '';

  // Modal proceso
  selectedProceso: Proceso | null = null;

  // Confirm modal
  showConfirmModal = false;
  confirmModalConfig: ConfirmModalConfig = {
    title: '', message: '', confirmText: 'Eliminar', cancelText: 'Cancelar', type: 'danger', icon: 'trash'
  };
  private confirmCallback: (() => void) | null = null;

  activeTab = 'procesos';

  readonly COLORES: ColorOption[] = [
    { valor: 'blue', hex: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { valor: 'emerald', hex: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', hex: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
  ];

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private stakeholderApiService: StakeholderApiService,
    private procesoApiService: ProcesoApiService,
    private herramientaApiService: HerramientaApiService,
    private encuestaApiService: EncuestaApiService,
    private entrevistaApiService: EntrevistaApiService,
    private historiaApiService: HistoriaUsuarioApiService,
    private focusGroupApiService: FocusGroupApiService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto.nombre = p.nombre;
          this.proyecto.descripcion = p.descripcion;
          this.proyecto.color = p.color;
        },
        error: (e) => console.error('Error al cargar proyecto:', e)
      });
      this.stakeholderApiService.getStakeholders(id).subscribe({
        next: (s) => this.stakeholders = s,
        error: (e) => console.error('Error al cargar stakeholders:', e)
      });
      this.loadProcesos(id);
    }
  }

  loadProcesos(proyectoId: string): void {
    this.procesoApiService.getProcesosByProyecto(parseInt(proyectoId)).subscribe({
      next: (p) => this.procesos = p,
      error: (e) => console.error('Error al cargar procesos:', e)
    });
  }

  goBack(): void { this.router.navigate(['/proyectos']); }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  getProcesoGradient(colorValor: string): string {
    const c = this.COLORES.find(x => x.valor === colorValor);
    return c ? c.gradient : this.COLORES[0].gradient;
  }

  getProcesoColor(colorValor: string): string {
    const c = this.COLORES.find(x => x.valor === colorValor);
    return c ? c.hex : this.COLORES[0].hex;
  }

  // ===== FORM =====

  handleSubmit(): void {
    if (!this.nombre || !this.descripcion) return;
    this.procesoApiService.createProceso({
      id_proyecto: parseInt(this.proyecto.id),
      nombre_proceso: this.nombre,
      descripcion: this.descripcion,
      color: this.color,
      id_stakeholder: this.stakeholder_id ? parseInt(this.stakeholder_id) : null,
      departamentos: [...this.departamentos],
      pasos_clave: [...this.pasos_clave],
    }).subscribe({
      next: () => { this.resetForm(); this.loadProcesos(this.proyecto.id); },
      error: (e) => console.error('Error al crear proceso:', e)
    });
  }

  resetForm(): void {
    this.nombre = ''; this.descripcion = ''; this.color = 'blue';
    this.stakeholder_id = ''; this.departamentos = []; this.pasos_clave = [];
    this.nuevoDepartamento = ''; this.nuevoPaso = ''; this.showForm = false;
  }

  addDepartamento(): void {
    if (this.nuevoDepartamento.trim()) { this.departamentos.push(this.nuevoDepartamento.trim()); this.nuevoDepartamento = ''; }
  }
  removeDepartamento(index: number): void { this.departamentos.splice(index, 1); }
  addPaso(): void {
    if (this.nuevoPaso.trim()) { this.pasos_clave.push(this.nuevoPaso.trim()); this.nuevoPaso = ''; }
  }
  removePaso(index: number): void { this.pasos_clave.splice(index, 1); }

  getStakeholderNombre(id: string): string {
    return this.stakeholders.find(s => s.id === id)?.nombre ?? 'N/A';
  }

  // ===== HERRAMIENTAS =====

  getLabelTipoHerramienta(tipo: string): string {
    return this.TIPOS_HERRAMIENTA.find(t => t.valor === tipo)?.label ?? tipo;
  }

  getIconoTipoHerramienta(tipo: string): string {
    return this.TIPOS_HERRAMIENTA.find(t => t.valor === tipo)?.icono ?? '';
  }

  getTipoPreguntaLabel(tipo: string): string {
    const labels: Record<string, string> = {
      texto_abierto: 'Texto abierto',
      opcion_multiple: 'Opción múltiple',
      escala: 'Escala 1-5',
      si_no: 'Sí / No',
    };
    return labels[tipo] ?? tipo;
  }

  onSelectTipoHerramienta(tipo: TipoHerramienta): void {
    if (this.subTipoHerramienta === tipo) {
      this.subTipoHerramienta = '';
      this.subHerramientaId = '';
      this.herramientasDisponibles = [];
      return;
    }
    this.subTipoHerramienta = tipo;
    this.subHerramientaId = '';
    this.herramientasDisponibles = [];
    this.loadingHerramientas = true;
    this.herramientaApiService.getHerramientasByTipo(tipo, parseInt(this.proyecto.id)).subscribe({
      next: (h) => { this.herramientasDisponibles = h; this.loadingHerramientas = false; },
      error: (e) => { console.error('Error al cargar herramientas:', e); this.loadingHerramientas = false; }
    });
  }

  private resetHerramienta(): void {
    this.subTipoHerramienta = ''; this.subHerramientaId = '';
    this.herramientasDisponibles = []; this.loadingHerramientas = false;
  }

  private loadHistoriaIntoForm(historia: HistoriaUsuario): void {
    this.historiaDetalle = historia;
    this.historiaForm = {
      titulo_historia: historia.titulo_historia || '',
      rol: historia.rol || '',
      quiero: historia.quiero || '',
      para_que: historia.para_que || '',
      prioridad: historia.prioridad || 'media',
      estimacion: historia.estimacion || '',
      criterios_aceptacion: historia.criterios_aceptacion
        ? historia.criterios_aceptacion.split(' | ')
        : [''],
    };
    this.loadingHistoria = false;
  }

  // ===== MODAL ENCUESTA =====

  openEncuestaModal(sub: Subproceso): void {
    if (!sub.herramienta) return;
    this.encuestaModal = true;
    this.loadingEncuesta = true;
    this.encuestaDetalle = null;
    this.respuestasMap = {};
    this.encuestaGuardada = false;
    this.encuestaSubprocesoId = sub.id;
    this.encuestaSubprocesoNombre = sub.nombre;

    const encuestaId = sub.herramienta.id;
    const subprocesoId = parseInt(sub.id);

    this.encuestaApiService.getEncuesta(encuestaId).subscribe({
      next: (encuesta) => {
        this.encuestaDetalle = encuesta;
        this.encuestaApiService.getRespuestas(encuestaId, subprocesoId).subscribe({
          next: (respuestas) => {
            respuestas.forEach(r => {
              this.respuestasMap[r.id_pregunta] = r.respuesta;
            });
            this.loadingEncuesta = false;
          },
          error: () => { this.loadingEncuesta = false; }
        });
      },
      error: (e) => { console.error('Error al cargar encuesta:', e); this.loadingEncuesta = false; }
    });
  }

  closeEncuestaModal(): void {
    this.encuestaModal = false;
    this.encuestaDetalle = null;
    this.respuestasMap = {};
    this.encuestaGuardada = false;
    this.savingRespuestas = false;
  }

  saveRespuestas(): void {
    if (!this.encuestaDetalle) return;
    this.savingRespuestas = true;
    this.encuestaGuardada = false;

    const respuestas = this.encuestaDetalle.preguntas.map(p => ({
      id_pregunta: p.id_pregunta,
      respuesta: this.respuestasMap[p.id_pregunta] ?? '',
    }));

    this.encuestaApiService.saveRespuestas({
      id_encuesta: this.encuestaDetalle.id_encuesta,
      id_subproceso: parseInt(this.encuestaSubprocesoId),
      respuestas,
    }).subscribe({
      next: () => {
        this.savingRespuestas = false;
        this.encuestaGuardada = true;
        setTimeout(() => this.encuestaGuardada = false, 3000);
      },
      error: (e) => { console.error('Error al guardar respuestas:', e); this.savingRespuestas = false; }
    });
  }

  // ===== MODAL ENTREVISTA =====

  openEntrevistaModal(sub: Subproceso): void {
    if (!sub.herramienta) return;
    this.entrevistaModal = true;
    this.loadingEntrevista = true;
    this.entrevistaDetalle = null;
    this.respuestasEntrevistaMap = {};
    this.entrevistaGuardada = false;
    this.entrevistaSubprocesoId = sub.id;
    this.entrevistaSubprocesoNombre = sub.nombre;

    const entrevistaId = sub.herramienta.id;

    this.entrevistaApiService.getEntrevista(entrevistaId).subscribe({
      next: (entrevista) => {
        this.entrevistaDetalle = entrevista;
        entrevista.preguntas.forEach(p => {
          if (p.respuesta) this.respuestasEntrevistaMap[p.id_pregunta] = p.respuesta;
        });
        this.loadingEntrevista = false;
      },
      error: (e) => { console.error('Error al cargar entrevista:', e); this.loadingEntrevista = false; }
    });
  }

  closeEntrevistaModal(): void {
    this.entrevistaModal = false;
    this.entrevistaDetalle = null;
    this.respuestasEntrevistaMap = {};
    this.entrevistaGuardada = false;
    this.savingRespuestasEntrevista = false;
  }

  saveRespuestasEntrevista(): void {
    if (!this.entrevistaDetalle) return;
    this.savingRespuestasEntrevista = true;
    this.entrevistaGuardada = false;

    const dto = {
      preguntas: this.entrevistaDetalle.preguntas.map(p => ({
        pregunta: p.pregunta,
        respuesta: this.respuestasEntrevistaMap[p.id_pregunta] ?? '',
      }))
    };

    this.entrevistaApiService.updateEntrevista(this.entrevistaDetalle.id_entrevista, dto).subscribe({
      next: () => {
        this.savingRespuestasEntrevista = false;
        this.entrevistaGuardada = true;
        setTimeout(() => this.entrevistaGuardada = false, 3000);
      },
      error: (e) => { console.error('Error al guardar respuestas:', e); this.savingRespuestasEntrevista = false; }
    });
  }

  // ===== MODAL HISTORIA DE USUARIO =====

  openHistoriaModal(sub: Subproceso): void {
    if (!sub.herramienta) return;
    this.historiaReadOnly = false;
    this.historiaModal = true;
    this.loadingHistoria = true;
    this.historiaDetalle = null;
    this.historiaGuardada = false;
    this.historiaSubprocesoNombre = sub.nombre;
    this.historiaApiService.getHistoria(Number(sub.herramienta.id)).subscribe({
      next: (historia) => this.loadHistoriaIntoForm(historia),
      error: (e) => { console.error('Error al cargar historia:', e); this.loadingHistoria = false; }
    });
  }

  openHistoriaModalReadOnly(sub: Subproceso): void {
    if (!sub.herramienta) return;
    this.historiaReadOnly = true;
    this.historiaModal = true;
    this.loadingHistoria = true;
    this.historiaDetalle = null;
    this.historiaGuardada = false;
    this.historiaSubprocesoNombre = sub.nombre;
    this.historiaApiService.getHistoria(Number(sub.herramienta.id)).subscribe({
      next: (historia) => this.loadHistoriaIntoForm(historia),
      error: (e) => { console.error('Error al cargar historia:', e); this.loadingHistoria = false; }
    });
  }

  closeHistoriaModal(): void {
    this.historiaModal = false;
    this.historiaDetalle = null;
    this.historiaGuardada = false;
    this.savingHistoria = false;
    this.historiaReadOnly = false;
  }

  saveHistoria(): void {
    if (!this.historiaDetalle) return;
    this.savingHistoria = true;
    this.historiaGuardada = false;

    const criterios = this.historiaForm.criterios_aceptacion.filter(c => c.trim());
    const dto: UpdateHistoriaUsuarioDto = {
      titulo_historia: this.historiaForm.titulo_historia,
      rol: this.historiaForm.rol,
      quiero: this.historiaForm.quiero,
      para_que: this.historiaForm.para_que,
      prioridad: this.historiaForm.prioridad,
      estimacion: this.historiaForm.estimacion || undefined,
      criterios_aceptacion: criterios.length > 0 ? criterios.join(' | ') : undefined,
    };

    this.historiaApiService.updateHistoria(this.historiaDetalle.id_historia, dto).subscribe({
      next: () => {
        this.savingHistoria = false;
        this.historiaGuardada = true;
        setTimeout(() => this.historiaGuardada = false, 3000);
      },
      error: (e) => { console.error('Error al guardar historia:', e); this.savingHistoria = false; }
    });
  }

  // ===== MODAL FOCUS GROUP =====

  openFocusGroupModal(sub: Subproceso): void {
    if (!sub.herramienta) return;
    this.focusGroupModal = true;
    this.loadingFocusGroup = true;
    this.focusGroupDetalle = null;
    this.focusGroupSubprocesoNombre = sub.nombre;
    this.focusGroupApiService.getFocusGroup(Number(sub.herramienta.id)).subscribe({
      next: (fg: FocusGroup) => { this.focusGroupDetalle = fg; this.loadingFocusGroup = false; },
      error: (e: unknown) => { console.error('Error al cargar focus group:', e); this.loadingFocusGroup = false; }
    });
  }

  closeFocusGroupModal(): void {
    this.focusGroupModal = false;
    this.focusGroupDetalle = null;
    this.focusGroupSubprocesoNombre = '';
  }

  // ===== SUBPROCESOS =====

  startAddSubproceso(procesoId: string): void {
    this.addingSubprocesoToId = procesoId;
    this.subNombre = ''; this.subDescripcion = '';
    this.resetHerramienta();
    this.subStakeholderId = this.procesos.find(p => p.id === procesoId)?.stakeholder_id || '';
  }

  cancelAddSubproceso(): void {
    this.addingSubprocesoToId = null;
    this.subNombre = ''; this.subDescripcion = ''; this.subStakeholderId = '';
    this.resetHerramienta();
  }

  addSubproceso(procesoId: string): void {
    if (!this.subNombre) return;
    this.procesoApiService.createSubproceso({
      id_proyecto: parseInt(this.proyecto.id),
      id_proceso: parseInt(procesoId),
      nombre_subproceso: this.subNombre,
      descripcion: this.subDescripcion,
      id_stakeholder: this.subStakeholderId ? parseInt(this.subStakeholderId) : null,
      tipo_herramienta: this.subTipoHerramienta || null,
      id_herramienta: this.subHerramientaId ? parseInt(this.subHerramientaId) : null,
    }).subscribe({
      next: () => { this.cancelAddSubproceso(); this.loadProcesos(this.proyecto.id); },
      error: (e) => console.error('Error al crear subproceso:', e)
    });
  }

  deleteSubproceso(procesoId: string, subId: string): void {
    this.openConfirmModal('¿Eliminar subproceso?', '¿Estás seguro? Esta acción no se puede deshacer.', () => {
      this.procesoApiService.deleteSubproceso(parseInt(subId)).subscribe({
        next: () => this.loadProcesos(this.proyecto.id),
        error: (e) => console.error('Error al eliminar subproceso:', e)
      });
    });
  }

  deleteProceso(id: string, event: Event): void {
    event.stopPropagation();
    this.openConfirmModal('¿Eliminar proceso?', '¿Estás seguro? Se eliminarán todos sus subprocesos.', () => {
      this.procesoApiService.deleteProceso(parseInt(id)).subscribe({
        next: () => this.loadProcesos(this.proyecto.id),
        error: (e) => console.error('Error al eliminar proceso:', e)
      });
    });
  }

  // ===== MODAL PROCESO =====

  viewProceso(proceso: Proceso): void {
    this.selectedProceso = proceso;
    this.addingSubprocesoModal = false;
  }

  closeModal(): void {
    this.selectedProceso = null;
    this.addingSubprocesoModal = false;
    this.subNombre = ''; this.subDescripcion = ''; this.subStakeholderId = '';
    this.resetHerramienta();
  }

  startAddSubprocesoModal(): void {
    this.addingSubprocesoModal = true;
    this.subNombre = ''; this.subDescripcion = '';
    this.resetHerramienta();
    this.subStakeholderId = this.selectedProceso?.stakeholder_id || '';
  }

  cancelAddSubprocesoModal(): void {
    this.addingSubprocesoModal = false;
    this.subNombre = ''; this.subDescripcion = ''; this.subStakeholderId = '';
    this.resetHerramienta();
  }

  addSubprocesoFromModal(): void {
    if (!this.subNombre || !this.selectedProceso) return;
    this.procesoApiService.createSubproceso({
      id_proyecto: parseInt(this.proyecto.id),
      id_proceso: parseInt(this.selectedProceso.id),
      nombre_subproceso: this.subNombre,
      descripcion: this.subDescripcion,
      id_stakeholder: this.subStakeholderId ? parseInt(this.subStakeholderId) : null,
      tipo_herramienta: this.subTipoHerramienta || null,
      id_herramienta: this.subHerramientaId ? parseInt(this.subHerramientaId) : null,
    }).subscribe({
      next: () => {
        this.cancelAddSubprocesoModal();
        this.loadProcesos(this.proyecto.id);
        setTimeout(() => {
          const actualizado = this.procesos.find(p => p.id === this.selectedProceso?.id);
          if (actualizado) this.selectedProceso = actualizado;
        }, 300);
      },
      error: (e) => console.error('Error al crear subproceso:', e)
    });
  }

  deleteSubprocesoFromModal(subId: string): void {
    this.openConfirmModal('¿Eliminar subproceso?', '¿Estás seguro? Esta acción no se puede deshacer.', () => {
      this.procesoApiService.deleteSubproceso(parseInt(subId)).subscribe({
        next: () => {
          this.loadProcesos(this.proyecto.id);
          setTimeout(() => {
            const actualizado = this.procesos.find(p => p.id === this.selectedProceso?.id);
            if (actualizado) this.selectedProceso = actualizado;
          }, 300);
        },
        error: (e) => console.error('Error al eliminar subproceso:', e)
      });
    });
  }

  // ===== CONFIRM MODAL =====

  openConfirmModal(title: string, message: string, callback: () => void): void {
    this.confirmModalConfig = { title, message, confirmText: 'Eliminar', cancelText: 'Cancelar', type: 'danger', icon: 'trash' };
    this.confirmCallback = callback;
    this.showConfirmModal = true;
  }

  onConfirmModal(): void {
    if (this.confirmCallback) this.confirmCallback();
    this.showConfirmModal = false;
    this.confirmCallback = null;
  }

  onCancelModal(): void {
    this.showConfirmModal = false;
    this.confirmCallback = null;
  }

  getHistoriaPrioridadBg(prioridad: string): string {
    if (prioridad === 'alta') return '#fee2e2';
    if (prioridad === 'baja') return '#dcfce7';
    return '#e0f2fe';
  }

  getHistoriaPrioridadColor(prioridad: string): string {
    if (prioridad === 'alta') return '#dc2626';
    if (prioridad === 'baja') return '#16a34a';
    return '#0284c7';
  }
}