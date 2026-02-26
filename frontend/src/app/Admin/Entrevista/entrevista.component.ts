import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { EntrevistaApiService, Entrevista } from '../../services/Entrevista-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';

interface PreguntaForm {
  texto: string;
  respuesta: string;
}

interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
}

interface EntrevistaUI extends Entrevista {
  estado: 'pendiente' | 'realizada';
  conRespuestas: boolean;
  archivos: ArchivoAdjunto[];
  fecha: string;
}

@Component({
  selector: 'app-entrevista',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent, ConfirmModalComponent],
  templateUrl: './entrevista.component.html',
  styleUrls: ['./entrevista.component.css']
})
export class EntrevistaComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };

  entrevistas: EntrevistaUI[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';
  anotandoId: number | null = null;
  activeTab = 'entrevistas';

  // Confirm modal state
  showConfirmModal = false;
  confirmModalConfig: ConfirmModalConfig = {
    title: '',
    message: '',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: 'trash'
  };
  entrevistaToDelete: number | null = null;

  // Entrevista being edited
  entrevistaEditando: number | null = null;

  // Vista de detalles
  entrevistaViendo: number | null = null;

  // Form fields
  titulo = '';
  entrevistador = '';
  entrevistado = '';
  notas = '';
  preguntas: PreguntaForm[] = [{ texto: '', respuesta: '' }];

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
    private entrevistaApiService: EntrevistaApiService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarEntrevistas();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  // ─── Carga de datos ────────────────────────────────────────────────────────

  cargarEntrevistas(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.entrevistaApiService.getEntrevistas(idProyecto).subscribe({
      next: (data: Entrevista[]) => {
        this.entrevistas = data.map((e: Entrevista) => ({
          ...e,
          estado: 'pendiente' as const,
          conRespuestas: e.preguntas.some(p => p.respuesta && p.respuesta.trim()),
          archivos: [],
          fecha: new Date().toISOString().split('T')[0],
        }));
        this.entrevistas.forEach(e => {
          if (e.conRespuestas) e.estado = 'realizada';
        });
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error al cargar entrevistas:', err);
        this.isLoading = false;
      }
    });
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  get totalEntrevistas(): number { return this.entrevistas.length; }
  get realizadas(): number { return this.entrevistas.filter(e => e.estado === 'realizada').length; }
  get pendientes(): number { return this.entrevistas.filter(e => e.estado === 'pendiente').length; }
  get entrevistasRealizadas(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'realizada'); }
  get entrevistasPendientes(): EntrevistaUI[] { return this.entrevistas.filter(e => e.estado === 'pendiente'); }

  // ─── Formulario ────────────────────────────────────────────────────────────

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  handleSubmit(): void {
    if (!this.titulo || !this.entrevistador || !this.entrevistado) return;

    const preguntasLimpias = this.preguntas
      .filter((p: PreguntaForm) => p.texto.trim())
      .map((p: PreguntaForm) => {
        const item: { pregunta: string; respuesta?: string } = {
          pregunta: p.texto.trim()
        };
        if (p.respuesta && p.respuesta.trim()) {
          item.respuesta = p.respuesta.trim();
        }
        return item;
      });

    if (this.entrevistaEditando) {
      // Actualizar entrevista existente
      const updateDto = {
        titulo_entrevista: this.titulo.trim(),
        entrevistador: this.entrevistador.trim(),
        entrevistado: this.entrevistado.trim(),
        notas_contexto: this.notas.trim(),
        preguntas: preguntasLimpias
      };
      this.entrevistaApiService.updateEntrevista(this.entrevistaEditando, updateDto).subscribe({
        next: (actualizada: Entrevista) => {
          const index = this.entrevistas.findIndex(e => e.id_entrevista === this.entrevistaEditando);
          if (index !== -1) {
            const entrevistaUI: EntrevistaUI = {
              ...actualizada,
              estado: actualizada.preguntas.some(p => p.respuesta && p.respuesta.trim()) ? 'realizada' : 'pendiente',
              conRespuestas: actualizada.preguntas.some(p => p.respuesta && p.respuesta.trim()),
              archivos: this.entrevistas[index].archivos,
              fecha: this.entrevistas[index].fecha,
            };
            this.entrevistas[index] = entrevistaUI;
          }
          this.resetForm();
          this.showForm = false;
        },
        error: (err: unknown) => {
          console.error('Error al actualizar entrevista:', err);
          this.errorMsg = 'Error al actualizar la entrevista. Intenta de nuevo.';
        }
      });
    } else {
      // Crear nueva entrevista
      const createDto = {
        id_proyecto: parseInt(this.proyecto.id, 10),
        titulo_entrevista: this.titulo.trim(),
        entrevistador: this.entrevistador.trim(),
        entrevistado: this.entrevistado.trim(),
        notas_contexto: this.notas.trim(),
        preguntas: preguntasLimpias
      };
      this.entrevistaApiService.createEntrevista(createDto).subscribe({
        next: (nueva: Entrevista) => {
          const nuevaUI: EntrevistaUI = {
            ...nueva,
            estado: 'pendiente',
            conRespuestas: false,
            archivos: [],
            fecha: new Date().toISOString().split('T')[0],
          };
          this.entrevistas.push(nuevaUI);
          this.resetForm();
          this.showForm = false;
        },
        error: (err: unknown) => {
          console.error('Error al crear entrevista:', err);
          this.errorMsg = 'Error al crear la entrevista. Intenta de nuevo.';
        }
      });
    }
  }

  resetForm(): void {
    this.titulo = '';
    this.entrevistador = '';
    this.entrevistado = '';
    this.notas = '';
    this.preguntas = [{ texto: '', respuesta: '' }];
    this.errorMsg = '';
    this.entrevistaEditando = null;
  }

  addPregunta(): void {
    this.preguntas.push({ texto: '', respuesta: '' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) this.preguntas.splice(index, 1);
  }

  // ─── Anotaciones ───────────────────────────────────────────────────────────

  startAnotar(entrevistaId: number): void {
    this.anotandoId = entrevistaId;
  }

  cancelAnotar(): void {
    this.anotandoId = null;
  }

  guardarRespuestas(entrevista: EntrevistaUI): void {
    const tieneRespuestas = entrevista.preguntas.some(p => p.respuesta && p.respuesta.trim());
    entrevista.conRespuestas = tieneRespuestas;
    if (tieneRespuestas) entrevista.estado = 'realizada';
    this.anotandoId = null;
  }

  // ─── Archivos ──────────────────────────────────────────────────────────────

  onFileSelect(event: Event, entrevistaId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const entrevista = this.entrevistas.find(e => e.id_entrevista === entrevistaId);
      if (entrevista) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          entrevista.archivos.push({
            id: this.generateUUID(),
            nombre: file.name,
            tipo: file.type
          });
        }
      }
    }
  }

  removeArchivo(entrevistaId: number, archivoId: string): void {
    const entrevista = this.entrevistas.find(e => e.id_entrevista === entrevistaId);
    if (entrevista) {
      entrevista.archivos = entrevista.archivos.filter(a => a.id !== archivoId);
    }
  }

  deleteEntrevista(id: number, event: Event): void {
    event.stopPropagation();
    const entrevista = this.entrevistas.find(e => e.id_entrevista === id);
    
    this.entrevistaToDelete = id;
    this.confirmModalConfig = {
      title: '¿Eliminar entrevista?',
      message: `¿Estás seguro de que deseas eliminar "${entrevista?.titulo_entrevista}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash'
    };
    this.showConfirmModal = true;
  }

  confirmDelete(): void {
    if (this.entrevistaToDelete) {
      this.entrevistaApiService.deleteEntrevista(this.entrevistaToDelete).subscribe({
        next: () => {
          this.entrevistas = this.entrevistas.filter(e => e.id_entrevista !== this.entrevistaToDelete);
          this.showConfirmModal = false;
          this.entrevistaToDelete = null;
        },
        error: (err: unknown) => {
          console.error('Error al eliminar entrevista:', err);
          this.showConfirmModal = false;
          this.entrevistaToDelete = null;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmModal = false;
    this.entrevistaToDelete = null;
  }

  editEntrevista(entrevista: EntrevistaUI): void {
    this.entrevistaEditando = entrevista.id_entrevista;
    this.titulo = entrevista.titulo_entrevista;
    this.entrevistador = entrevista.entrevistador;
    this.entrevistado = entrevista.entrevistado;
    this.notas = entrevista.notas_contexto || '';
    this.preguntas = entrevista.preguntas.map(p => ({
      texto: p.pregunta,
      respuesta: p.respuesta || ''
    }));
    this.showForm = true;

    // Scroll to form
    setTimeout(() => {
      document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  verEntrevista(id: number): void {
    this.entrevistaViendo = this.entrevistaViendo === id ? null : id;
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}