import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { HistoriaUsuarioApiService, HistoriaUsuario, CreateHistoriaUsuarioDto } from '../../services/HistoriasUsuario-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

@Component({
    selector: 'app-casos-uso',
    standalone: true,
    imports: [CommonModule, FormsModule, BarraComponent],
    templateUrl: './cu.component.html',
    styleUrls: ['./cu.component.css']
})
export class CasosUsoComponent implements OnInit {

    showForm = false;
    historias: HistoriaUsuario[] = [];
    isLoading = false;
    errorMsg = '';

    proyecto = { id: '', nombre: '', descripcion: '', color: 'blue' };
    activeTab = 'historias';

    // Procesos y subprocesos
    procesosDisponibles: Proceso[] = [];
    subprocesosDisponibles: Subproceso[] = [];
    procesoVinculadoId = '';
    subprocesoId = '';

    // Campos del formulario
    titulo = '';
    como = '';
    quiero = '';
    paraque = '';
    prioridad: 'baja' | 'media' | 'alta' = 'media';
    estimacion = '';
    criteriosAceptacion: string[] = [''];

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
        private historiaApiService: HistoriaUsuarioApiService,
        private procesoApiService: ProcesoApiService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.proyecto.id = id;
            this.proyectoApiService.getProyecto(id).subscribe({
                next: (p) => {
                    this.proyecto = { id, nombre: p.nombre, descripcion: p.descripcion, color: p.color };
                    this.cargarHistorias();
                    this.cargarProcesos();
                },
                error: (err) => console.error('Error al cargar proyecto:', err)
            });
        }
    }

    // ─── Carga de datos ────────────────────────────────────────────────────────

    cargarHistorias(): void {
        this.isLoading = true;
        const idProyecto = parseInt(this.proyecto.id, 10);
        this.historiaApiService.getHistorias(idProyecto).subscribe({
            next: (data) => {
                this.historias = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar historias:', err);
                this.isLoading = false;
            }
        });
    }

    cargarProcesos(): void {
        const idProyecto = parseInt(this.proyecto.id, 10);
        if (!idProyecto) return;
        this.procesoApiService.getProcesosByProyecto(idProyecto).subscribe({
            next: (data) => { this.procesosDisponibles = data; },
            error: (err) => console.error('Error al cargar procesos:', err)
        });
    }

    onProcesoChange(): void {
        this.subprocesoId = '';
        if (!this.procesoVinculadoId) {
            this.subprocesosDisponibles = [];
            return;
        }
        const proceso = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
        this.subprocesosDisponibles = proceso?.subprocesos || [];
    }

    // ─── Formulario ────────────────────────────────────────────────────────────

    isFormValid(): boolean {
        return !!(this.titulo.trim() && this.como.trim() && this.quiero.trim() && this.paraque.trim()
            && this.procesoVinculadoId && this.subprocesoId);
    }

    handleSubmit(): void {
        if (!this.isFormValid()) {
            this.errorMsg = 'Completa todos los campos obligatorios incluyendo proceso y subproceso.';
            return;
        }

        const criterios = this.criteriosAceptacion.filter(c => c.trim());

        const dto: CreateHistoriaUsuarioDto = {
            id_proyecto: parseInt(this.proyecto.id, 10),
            id_proceso: parseInt(this.procesoVinculadoId, 10),
            id_subproceso: parseInt(this.subprocesoId, 10),
            titulo_historia: this.titulo.trim(),
            rol: this.como.trim(),
            quiero: this.quiero.trim(),
            para_que: this.paraque.trim(),
            prioridad: this.prioridad,
            estimacion: this.estimacion.trim() || undefined,
            criterios_aceptacion: criterios.length > 0 ? criterios.join(' | ') : undefined
        };

        this.historiaApiService.createHistoria(dto).subscribe({
            next: (nueva) => {
                this.historias.push(nueva);
                this.resetForm();
                this.showForm = false;
            },
            error: (err) => {
                console.error('Error al crear historia:', err);
                this.errorMsg = 'Error al crear la historia. Intenta de nuevo.';
            }
        });
    }

    resetForm(): void {
        this.titulo = '';
        this.como = '';
        this.quiero = '';
        this.paraque = '';
        this.prioridad = 'media';
        this.estimacion = '';
        this.criteriosAceptacion = [''];
        this.procesoVinculadoId = '';
        this.subprocesoId = '';
        this.subprocesosDisponibles = [];
        this.errorMsg = '';
    }

    eliminarHistoria(id: number): void {
        if (!confirm('¿Está seguro de eliminar esta historia?')) return;
        this.historiaApiService.deleteHistoria(id).subscribe({
            next: () => {
                this.historias = this.historias.filter(h => h.id_historia !== id);
            },
            error: (err) => console.error('Error al eliminar historia:', err)
        });
    }

    // Parsear criterios del string del backend para mostrarlos como lista
    getCriterios(historia: HistoriaUsuario): string[] {
        if (!historia.criterios_aceptacion) return [];
        return historia.criterios_aceptacion.split(' | ').filter(c => c.trim());
    }

    // ─── Utilidades ────────────────────────────────────────────────────────────

    goBack(): void {
        this.router.navigate(['/proyectos']);
    }

    getProyectoGradient(): string {
        const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
        return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackByHistoria(index: number, item: HistoriaUsuario): number {
        return item.id_historia;
    }
}