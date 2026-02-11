import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';

interface HistoriaUsuario {
    id: string;
    titulo: string;
    fecha?: string;
    proyecto_nombre?: string;
    proyecto: string;
    subproyecto: string;
    como: string;
    quiero: string;
    paraque: string;
    prioridad: 'Alta' | 'Media' | 'Baja';
    estimacion: string;
    criteriosAceptacion: string[];
}

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

    // Proyecto actual
    proyecto = {
        id: '',
        nombre: '',
        descripcion: '',
        color: 'blue'
    };

    // Active tab in project sidebar
    activeTab = 'historias';

    // Campos del formulario
    titulo = '';
    proyecto_nombre = '';
    subproyecto = '';
    como = '';
    quiero = '';
    paraque = '';
    prioridad: 'Alta' | 'Media' | 'Baja' = 'Media';
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

    constructor(private router: Router, private route: ActivatedRoute, private proyectoApiService: ProyectoApiService) {}

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

    getEmptyHistoria(): HistoriaUsuario {
        return {
            id: '',
            titulo: '',
            proyecto: '',
            subproyecto: '',
            como: '',
            quiero: '',
            paraque: '',
            prioridad: 'Media',
            estimacion: '',
            criteriosAceptacion: ['']
        };
    }

    isFormValid(): boolean {
        return !!(this.titulo && this.titulo.trim().length > 0 &&
                  this.como && this.como.trim().length > 0 &&
                  this.quiero && this.quiero.trim().length > 0 &&
                  this.paraque && this.paraque.trim().length > 0);
    }

    resetForm() {
        this.titulo = '';
        this.proyecto_nombre = '';
        this.subproyecto = '';
        this.como = '';
        this.quiero = '';
        this.paraque = '';
        this.prioridad = 'Media';
        this.estimacion = '';
        this.criteriosAceptacion = [''];
    }

    handleSubmit() {
        if (!this.titulo.trim() || !this.como.trim() || !this.quiero.trim() || !this.paraque.trim()) {
            return;
        }

        // Limpiar criterios vacíos
        const criterios = this.criteriosAceptacion.filter(c => c.trim() !== '');

        // Generar fecha actual
        const now = new Date();
        const fecha = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        const nueva: HistoriaUsuario = {
            id: this.generateUUID(),
            titulo: this.titulo.trim(),
            fecha: fecha,
            proyecto_nombre: this.proyecto_nombre.trim(),
            proyecto: this.proyecto_nombre.trim(),
            subproyecto: this.subproyecto.trim(),
            como: this.como.trim(),
            quiero: this.quiero.trim(),
            paraque: this.paraque.trim(),
            prioridad: this.prioridad,
            estimacion: this.estimacion.trim(),
            criteriosAceptacion: criterios.length > 0 ? criterios : []
        };

        this.historias.push(nueva);
        console.log('Historia creada. Total historias:', this.historias.length, this.historias);
        this.resetForm();
        this.showForm = false;
    }

    eliminarHistoria(id: string) {
        if (confirm('¿Está seguro de eliminar esta historia?')) {
            this.historias = this.historias.filter(h => h.id !== id);
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

    trackByHistoria(index: number, item: HistoriaUsuario): string {
        return item.id;
    }
}
