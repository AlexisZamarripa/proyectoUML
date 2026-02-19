// seguimiento.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { SeguimientoApiService, SeguimientoResponse, Paso, Metrica } from '../../services/seguimiento-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

@Component({
    selector: 'app-seguimiento',
    standalone: true,
    imports: [CommonModule, FormsModule, BarraComponent],
    templateUrl: './seguimiento.component.html',
    styleUrls: ['./seguimiento.component.css']
})
export class SeguimientoComponent implements OnInit {
    showForm = false;
    seguimientos: SeguimientoResponse[] = [];
    procesosDisponibles: Proceso[] = [];
    subprocesosDisponibles: Subproceso[] = [];

    // Proyecto actual
    proyecto = {
        id: '',
        nombre: '',
        descripcion: '',
        color: 'blue'
    };

    // Active tab in project sidebar
    activeTab = 'seguimiento';

    // Campos del formulario
    titulo = '';
    nombreProceso = '';
    procesoVinculadoId = ''; // ID del proceso seleccionado
    subprocesoId = ''; // ID del subproceso seleccionado
    pasos: Paso[] = [{ nombre: '', duracion: '', responsable: '' }];
    problemas: string[] = [''];
    metricas: Metrica[] = [{ nombre: '', valor: '' }];

    readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
        { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
        { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
        { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
        { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
        { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' }
    ];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private proyectoApiService: ProyectoApiService,
        private seguimientoApiService: SeguimientoApiService,
        private procesoApiService: ProcesoApiService
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
                error: (error) => console.error('Error al cargar proyecto:', error)
            });
            this.cargarSeguimientos();
            this.cargarProcesos();
        }
    }

    cargarProcesos(): void {
        const idProyecto = parseInt(this.proyecto.id, 10);
        if (!idProyecto) return;
        this.procesoApiService.getProcesosByProyecto(idProyecto).subscribe({
            next: (data) => {
                this.procesosDisponibles = data;
            },
            error: (error) => console.error('Error al cargar procesos:', error)
        });
    }

    onProcesoChange(): void {
        // Cuando se selecciona un proceso, cargar sus subprocesos
        this.subprocesoId = '';
        if (!this.procesoVinculadoId) {
            this.subprocesosDisponibles = [];
            return;
        }
        const proceso = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
        if (proceso) {
            this.subprocesosDisponibles = proceso.subprocesos || [];
        }
    }

    cargarSeguimientos(): void {
        const idProyecto = parseInt(this.proyecto.id, 10);
        if (!idProyecto) return;
        this.seguimientoApiService.getByProyecto(idProyecto).subscribe({
            next: (data) => {
                this.seguimientos = data;
            },
            error: (error) => console.error('Error al cargar seguimientos:', error)
        });
    }

    goBack(): void {
        this.router.navigate(['/proyectos']);
    }

    getProyectoGradient(): string {
        const c = this.COLORES_PROYECTO.find(x => x.valor === this.proyecto.color);
        return c ? c.gradient : this.COLORES_PROYECTO[0].gradient;
    }

    isFormValid(): boolean {
        return !!(this.titulo && this.titulo.trim().length > 0 &&
            this.nombreProceso && this.nombreProceso.trim().length > 0);
    }

    resetForm() {
        this.titulo = '';
        this.nombreProceso = '';
        this.procesoVinculadoId = '';
        this.subprocesoId = '';
        this.pasos = [{ nombre: '', duracion: '', responsable: '' }];
        this.problemas = [''];
        this.metricas = [{ nombre: '', valor: '' }];
        this.subprocesosDisponibles = [];
    }

    handleSubmit() {
        if (!this.isFormValid()) {
            return;
        }

        // Limpiar datos vacíos
        const pasosLimpios = this.pasos.filter(p => p.nombre.trim() !== '');
        const problemasLimpios = this.problemas.filter(p => p.trim() !== '');
        const metricasLimpias = this.metricas.filter(m => m.nombre.trim() !== '' && m.valor.trim() !== '');

        // Obtener nombres de proceso y subproceso seleccionados
        const procesoSeleccionado = this.procesosDisponibles.find(p => p.id === this.procesoVinculadoId);
        const subprocesoSeleccionado = this.subprocesosDisponibles.find(s => s.id === this.subprocesoId);

        const dto = {
            id_proyecto: parseInt(this.proyecto.id, 10),
            id_proceso: this.procesoVinculadoId ? parseInt(this.procesoVinculadoId, 10) : undefined,
            id_subproceso: this.subprocesoId ? parseInt(this.subprocesoId, 10) : undefined,
            titulo: this.titulo.trim(),
            nombreProceso: this.nombreProceso.trim(),
            procesoVinculado: procesoSeleccionado?.nombre || '',
            subproceso: subprocesoSeleccionado?.nombre || '',
            pasos: pasosLimpios,
            problemas: problemasLimpios,
            metricas: metricasLimpias
        };

        this.seguimientoApiService.create(dto).subscribe({
            next: (nuevo) => {
                this.seguimientos.unshift(nuevo);
                this.resetForm();
                this.showForm = false;
            },
            error: (error) => console.error('Error al crear seguimiento:', error)
        });
    }

    eliminarSeguimiento(id: string) {
        if (confirm('¿Está seguro de eliminar este seguimiento?')) {
            this.seguimientoApiService.delete(parseInt(id, 10)).subscribe({
                next: () => {
                    this.seguimientos = this.seguimientos.filter(s => s.id !== id);
                },
                error: (error) => console.error('Error al eliminar seguimiento:', error)
            });
        }
    }

    agregarPaso() {
        this.pasos.push({ nombre: '', duracion: '', responsable: '' });
    }

    eliminarPaso(index: number) {
        if (this.pasos.length > 1) {
            this.pasos.splice(index, 1);
        }
    }

    agregarProblema() {
        this.problemas.push('');
    }

    eliminarProblema(index: number) {
        if (this.problemas.length > 1) {
            this.problemas.splice(index, 1);
        }
    }

    agregarMetrica() {
        this.metricas.push({ nombre: '', valor: '' });
    }

    eliminarMetrica(index: number) {
        if (this.metricas.length > 1) {
            this.metricas.splice(index, 1);
        }
    }

    calcularTiempoTotal(seguimiento: SeguimientoResponse): string {
        let totalMinutos = 0;
        for (const paso of seguimiento.pasos) {
            const duracion = this.parseDuracion(paso.duracion);
            totalMinutos += duracion;
        }
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        if (horas > 0 && minutos > 0) {
            return `${horas} h ${minutos} min`;
        } else if (horas > 0) {
            return `${horas} h`;
        } else {
            return `${minutos} min`;
        }
    }

    private parseDuracion(duracion: string): number {
        // Parse "5 min", "2h", "1h 30min", etc.
        let totalMinutos = 0;
        const horasMatch = duracion.match(/(\d+)\s*h/i);
        const minutosMatch = duracion.match(/(\d+)\s*min/i);

        if (horasMatch) {
            totalMinutos += parseInt(horasMatch[1]) * 60;
        }
        if (minutosMatch) {
            totalMinutos += parseInt(minutosMatch[1]);
        }

        return totalMinutos;
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackBySeguimiento(index: number, item: SeguimientoResponse): string {
        return item.id;
    }
}
