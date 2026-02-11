import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';

interface Paso {
    nombre: string;
    duracion: string;
    responsable: string;
}

interface Metrica {
    nombre: string;
    valor: string;
}

interface Seguimiento {
    id: string;
    titulo: string;
    fecha: string;
    idTransaccion: string;
    nombreProceso: string;
    procesoVinculado: string;
    subproceso: string;
    pasos: Paso[];
    problemas: string[];
    metricas: Metrica[];
}

@Component({
    selector: 'app-seguimiento',
    standalone: true,
    imports: [CommonModule, FormsModule, BarraComponent],
    templateUrl: './seguimiento.component.html',
    styleUrls: ['./seguimiento.component.css']
})
export class SeguimientoComponent implements OnInit {
    showForm = false;
    seguimientos: Seguimiento[] = [];

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
    idTransaccion = '';
    nombreProceso = '';
    procesoVinculado = '';
    subproceso = '';
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
        private proyectoApiService: ProyectoApiService
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
        }
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
                  this.idTransaccion && this.idTransaccion.trim().length > 0 &&
                  this.nombreProceso && this.nombreProceso.trim().length > 0);
    }

    resetForm() {
        this.titulo = '';
        this.idTransaccion = '';
        this.nombreProceso = '';
        this.procesoVinculado = '';
        this.subproceso = '';
        this.pasos = [{ nombre: '', duracion: '', responsable: '' }];
        this.problemas = [''];
        this.metricas = [{ nombre: '', valor: '' }];
    }

    handleSubmit() {
        if (!this.isFormValid()) {
            return;
        }

        // Limpiar datos vacíos
        const pasosLimpios = this.pasos.filter(p => p.nombre.trim() !== '');
        const problemasLimpios = this.problemas.filter(p => p.trim() !== '');
        const metricasLimpias = this.metricas.filter(m => m.nombre.trim() !== '' && m.valor.trim() !== '');

        // Generar fecha actual
        const now = new Date();
        const fecha = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        const nuevo: Seguimiento = {
            id: this.generateUUID(),
            titulo: this.titulo.trim(),
            fecha: fecha,
            idTransaccion: this.idTransaccion.trim(),
            nombreProceso: this.nombreProceso.trim(),
            procesoVinculado: this.procesoVinculado.trim(),
            subproceso: this.subproceso.trim(),
            pasos: pasosLimpios,
            problemas: problemasLimpios,
            metricas: metricasLimpias
        };

        this.seguimientos.push(nuevo);
        console.log('Seguimiento creado. Total seguimientos:', this.seguimientos.length, this.seguimientos);
        this.resetForm();
        this.showForm = false;
    }

    eliminarSeguimiento(id: string) {
        if (confirm('¿Está seguro de eliminar este seguimiento?')) {
            this.seguimientos = this.seguimientos.filter(s => s.id !== id);
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

    calcularTiempoTotal(seguimiento: Seguimiento): string {
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

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackBySeguimiento(index: number, item: Seguimiento): string {
        return item.id;
    }
}
