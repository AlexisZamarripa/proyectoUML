import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ProyectoService } from '../../services/proyecto.service';

interface HistoriaUsuario {
    id: string;
    titulo: string;
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
    showModal = false;
    isEditing = false;
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
    currentHistoria: HistoriaUsuario = this.getEmptyHistoria();

    readonly COLORES_PROYECTO: { valor: string; gradient: string }[] = [
        { valor: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
        { valor: 'emerald', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
        { valor: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
        { valor: 'orange', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
        { valor: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
        { valor: 'indigo', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    ];

    constructor(private router: Router, private route: ActivatedRoute, private proyectoService: ProyectoService) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.proyecto.id = id;
            const p = this.proyectoService.getProyectoById(id);
            if (p) {
                this.proyecto.nombre = p.nombre;
                this.proyecto.descripcion = p.descripcion;
                this.proyecto.color = p.color;
            }
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

    openNewModal() {
        this.isEditing = false;
        this.currentHistoria = this.getEmptyHistoria();
        this.showModal = true;
    }

    openEditModal(historia: HistoriaUsuario) {
        this.isEditing = true;
        this.currentHistoria = JSON.parse(JSON.stringify(historia));
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.currentHistoria = this.getEmptyHistoria();
    }

    addCriterio() {
        this.currentHistoria.criteriosAceptacion.push('');
    }

    removeCriterio(index: number) {
        if (this.currentHistoria.criteriosAceptacion.length > 1) {
            this.currentHistoria.criteriosAceptacion.splice(index, 1);
        }
    }

    guardarHistoria() {
        // Limpiar criterios vacíos
        this.currentHistoria.criteriosAceptacion = this.currentHistoria.criteriosAceptacion.filter(c => c.trim() !== '');

        if (this.isEditing) {
            const index = this.historias.findIndex(h => h.id === this.currentHistoria.id);
            if (index !== -1) {
                this.historias[index] = JSON.parse(JSON.stringify(this.currentHistoria));
            }
        } else {
            this.currentHistoria.id = this.generateUUID();
            this.historias.push(JSON.parse(JSON.stringify(this.currentHistoria)));
        }

        this.closeModal();
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
