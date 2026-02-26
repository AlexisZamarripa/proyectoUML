import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { EncuestaApiService, Encuesta, TipoPregunta } from '../../services/Encuesta-api.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';

interface PreguntaForm {
  texto: string;
  tipo: TipoPregunta;
}

interface EncuestaUI extends Encuesta {
  fecha: string;
  participantesReales: number;
}

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule, BarraComponent, ConfirmModalComponent],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit {

  proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };

  activeTab = 'encuestas';
  encuestas: EncuestaUI[] = [];
  showForm = false;
  isLoading = false;
  errorMsg = '';

  // Modal states
  selectedEncuesta: EncuestaUI | null = null;
  editingEncuesta: EncuestaUI | null = null;
  showConfirmModal = false;
  confirmModalConfig: ConfirmModalConfig = {
    title: '',
    message: '',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: 'trash'
  };
  encuestaToDelete: number | null = null;

  readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
    { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  // Form fields
  titulo = '';
  descripcion = '';
  participantesEsperados = 0;
  preguntas: PreguntaForm[] = [{ texto: '', tipo: 'texto_abierto' }];

  TIPOS_PREGUNTA: { valor: TipoPregunta; label: string }[] = [
    { valor: 'texto_abierto', label: 'Texto abierto' },
    { valor: 'opcion_multiple', label: 'Opción múltiple' },
    { valor: 'escala', label: 'Escala (1-5)' },
    { valor: 'si_no', label: 'Sí / No' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proyectoApiService: ProyectoApiService,
    private encuestaApiService: EncuestaApiService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyecto.id = id;
      this.proyectoApiService.getProyecto(id).subscribe({
        next: (p) => {
          this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
          this.cargarEncuestas();
        },
        error: (err) => console.error('Error al cargar proyecto:', err)
      });
    }
  }

  cargarEncuestas(): void {
    this.isLoading = true;
    const idProyecto = parseInt(this.proyecto.id, 10);
    this.encuestaApiService.getEncuestas(idProyecto).subscribe({
      next: (data: Encuesta[]) => {
        this.encuestas = data.map((e: Encuesta) => ({
          ...e,
          fecha: new Date().toISOString().split('T')[0],
          participantesReales: 0,
        }));
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error al cargar encuestas:', err);
        this.isLoading = false;
      }
    });
  }

  get totalEncuestas(): number { return this.encuestas.length; }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  handleSubmit(): void {
    if (!this.titulo.trim() || !this.descripcion.trim()) return;

    if (this.editingEncuesta) {
      this.handleEditSubmit();
      return;
    }

    const dto = {
      id_proyecto: parseInt(this.proyecto.id, 10),
      titulo_encuesta: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      numero_participantes_esperados: this.participantesEsperados,
      preguntas: this.preguntas
        .filter((p: PreguntaForm) => p.texto.trim())
        .map((p: PreguntaForm) => ({ pregunta: p.texto, tipo_pregunta: p.tipo }))
    };

    this.encuestaApiService.createEncuesta(dto).subscribe({
      next: (nueva: Encuesta) => {
        const nuevaUI: EncuestaUI = {
          ...nueva,
          fecha: new Date().toISOString().split('T')[0],
          participantesReales: 0,
        };
        this.encuestas.push(nuevaUI);
        this.resetForm();
        this.showForm = false;
      },
      error: (err: unknown) => {
        console.error('Error al crear encuesta:', err);
        this.errorMsg = 'Error al crear la encuesta. Intenta de nuevo.';
      }
    });
  }

  resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.participantesEsperados = 0;
    this.preguntas = [{ texto: '', tipo: 'texto_abierto' }];
    this.errorMsg = '';
    this.editingEncuesta = null;
  }

  addPregunta(): void {
    this.preguntas.push({ texto: '', tipo: 'texto_abierto' });
  }

  removePregunta(index: number): void {
    if (this.preguntas.length > 1) this.preguntas.splice(index, 1);
  }

  deleteEncuesta(id: number): void {
    const enc = this.encuestas.find(e => e.id_encuesta === id);
    this.encuestaToDelete = id;
    this.confirmModalConfig = {
      title: '¿Eliminar encuesta?',
      message: `¿Estás seguro de que deseas eliminar la encuesta "${enc?.titulo_encuesta || ''}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash'
    };
    this.showConfirmModal = true;
  }

  confirmDelete(): void {
    if (this.encuestaToDelete) {
      this.encuestaApiService.deleteEncuesta(this.encuestaToDelete).subscribe({
        next: () => {
          this.encuestas = this.encuestas.filter(e => e.id_encuesta !== this.encuestaToDelete);
          this.showConfirmModal = false;
          this.encuestaToDelete = null;
        },
        error: (err: unknown) => {
          console.error('Error al eliminar encuesta:', err);
          this.showConfirmModal = false;
          this.encuestaToDelete = null;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmModal = false;
    this.encuestaToDelete = null;
  }

  verEncuesta(enc: EncuestaUI): void {
    this.selectedEncuesta = enc;
  }

  closeModal(): void {
    this.selectedEncuesta = null;
  }

  editarEncuesta(enc: EncuestaUI): void {
    this.editingEncuesta = enc;
    this.titulo = enc.titulo_encuesta;
    this.descripcion = enc.descripcion;
    this.participantesEsperados = enc.numero_participantes_esperados;
    this.preguntas = enc.preguntas.map(p => ({
      texto: p.pregunta,
      tipo: p.tipo_pregunta
    }));
    this.showForm = true;
  }

  handleEditSubmit(): void {
    if (!this.editingEncuesta || !this.titulo.trim() || !this.descripcion.trim()) return;

    const dto = {
      titulo_encuesta: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      numero_participantes_esperados: this.participantesEsperados
    };

    console.log('Enviando DTO de actualización:', dto);
    console.log('ID encuesta:', this.editingEncuesta.id_encuesta);

    this.encuestaApiService.updateEncuesta(this.editingEncuesta.id_encuesta, dto).subscribe({
      next: (actualizada: Encuesta) => {
        const index = this.encuestas.findIndex(e => e.id_encuesta === this.editingEncuesta!.id_encuesta);
        if (index !== -1) {
          this.encuestas[index] = {
            ...actualizada,
            fecha: this.encuestas[index].fecha,
            participantesReales: this.encuestas[index].participantesReales
          };
        }
        this.resetForm();
        this.showForm = false;
        this.editingEncuesta = null;
      },
      error: (err: any) => {
        console.error('Error completo:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.error);
        this.errorMsg = `Error al actualizar: ${err.error?.message || err.message || 'Error desconocido'}`;
      }
    });
  }

  goBack(): void { this.router.navigate(['/proyectos']); }

  getProyectoGradient(): string {
    const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
    return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getTipoPreguntaLabel(tipo: TipoPregunta): string {
    const tipoMap: { [key in TipoPregunta]: string } = {
      'texto_abierto': 'Texto abierto',
      'opcion_multiple': 'Opción múltiple',
      'escala': 'Escala (1-5)',
      'si_no': 'Sí / No'
    };
    return tipoMap[tipo] || tipo;
  }
}