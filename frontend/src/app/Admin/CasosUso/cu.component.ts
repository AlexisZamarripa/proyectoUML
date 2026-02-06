import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    imports: [CommonModule, FormsModule],
    templateUrl: './cu.component.html',
    styleUrls: ['./cu.component.css']
})
export class CasosUsoComponent {
    showModal = false;
    isEditing = false;
    historias: HistoriaUsuario[] = [];

    // Campos del formulario
    currentHistoria: HistoriaUsuario = this.getEmptyHistoria();

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
