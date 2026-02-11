import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';

interface Documento {
    nombre: string;
    tipo: string;
    url: string;
    descripcion: string;
}

interface AnalisisDocumento {
    id: string;
    titulo: string;
    fecha?: string;
    tipoDocumento: string;
    fuente: string;
    proceso: string;
    subproceso: string;
    documentos: Documento[];
    hallazgos: string[];
    recomendaciones: string;
}

@Component({
    selector: 'app-documentos',
    standalone: true,
    imports: [CommonModule, FormsModule, BarraComponent],
    templateUrl: './doc.component.html',
    styleUrls: ['./doc.component.css']
})
export class DocumentosComponent implements OnInit {
    showForm = false;
    analisis: AnalisisDocumento[] = [];

    // Proyecto actual
    proyecto = {
        id: '',
        nombre: '',
        descripcion: '',
        color: 'blue'
    };

    // Active tab in project sidebar
    activeTab = 'documentos';

    // Campos del formulario
    titulo = '';
    tipoDocumento = '';
    fuente = '';
    proceso = '';
    subproceso = '';
    documentos: Documento[] = [{ nombre: '', tipo: '', url: '', descripcion: '' }];
    hallazgos: string[] = [''];
    recomendaciones = '';

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
                  this.tipoDocumento && this.tipoDocumento.trim().length > 0);
    }

    resetForm() {
        this.titulo = '';
        this.tipoDocumento = '';
        this.fuente = '';
        this.proceso = '';
        this.subproceso = '';
        this.documentos = [{ nombre: '', tipo: '', url: '', descripcion: '' }];
        this.hallazgos = [''];
        this.recomendaciones = '';
    }

    handleSubmit() {
        if (!this.isFormValid()) {
            return;
        }

        // Limpiar documentos y hallazgos vacíos
        const docsLimpios = this.documentos.filter(d => d.nombre.trim() !== '');
        const hallazgosLimpios = this.hallazgos.filter(h => h.trim() !== '');

        // Generar fecha actual
        const now = new Date();
        const fecha = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        const nuevo: AnalisisDocumento = {
            id: this.generateUUID(),
            titulo: this.titulo.trim(),
            fecha: fecha,
            tipoDocumento: this.tipoDocumento.trim(),
            fuente: this.fuente.trim(),
            proceso: this.proceso.trim(),
            subproceso: this.subproceso.trim(),
            documentos: docsLimpios.length > 0 ? docsLimpios : [],
            hallazgos: hallazgosLimpios.length > 0 ? hallazgosLimpios : [],
            recomendaciones: this.recomendaciones.trim()
        };

        this.analisis.push(nuevo);
        console.log('Análisis creado. Total análisis:', this.analisis.length, this.analisis);
        this.resetForm();
        this.showForm = false;
    }

    eliminarAnalisis(id: string) {
        if (confirm('¿Está seguro de eliminar este análisis?')) {
            this.analisis = this.analisis.filter(a => a.id !== id);
        }
    }

    agregarDocumento() {
        this.documentos.push({ nombre: '', tipo: '', url: '', descripcion: '' });
    }

    eliminarDocumento(index: number) {
        if (this.documentos.length > 1) {
            this.documentos.splice(index, 1);
        }
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

    trackByAnalisis(index: number, item: AnalisisDocumento): string {
        return item.id;
    }
}
