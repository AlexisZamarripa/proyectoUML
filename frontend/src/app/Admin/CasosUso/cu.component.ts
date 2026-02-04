import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface HistoriaUsuario {
    id: string;
    date: string;
    titulo: string;
    como: string;
    quiero: string;
    paraque: string;
    prioridad: 'alta' | 'media' | 'baja';
    estimacion?: string;
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
    showForm = false;
    selectedHistoria: HistoriaUsuario | null = null;
    historias: HistoriaUsuario[] = [];

    // Campos del formulario
    titulo = '';
    como = '';
    quiero = '';
    paraque = '';
    prioridad: 'alta' | 'media' | 'baja' = 'media';
    estimacion = '';
    criteriosAceptacion: string[] = [''];

    toggleForm() {
        this.showForm = !this.showForm;
        if (this.showForm) {
            this.resetForm();
        }
    }

    resetForm() {
        this.titulo = '';
        this.como = '';
        this.quiero = '';
        this.paraque = '';
        this.prioridad = 'media';
        this.estimacion = '';
        this.criteriosAceptacion = [''];
    }

    addCriterio() {
        this.criteriosAceptacion.push('');
    }

    removeCriterio(index: number) {
        this.criteriosAceptacion = this.criteriosAceptacion.filter((_, i) => i !== index);
    }

    updateCriterio(index: number, value: string) {
        this.criteriosAceptacion[index] = value;
    }

    handleSubmit() {
        const historia: HistoriaUsuario = {
            id: this.generateUUID(),
            date: new Date().toISOString(),
            titulo: this.titulo,
            como: this.como,
            quiero: this.quiero,
            paraque: this.paraque,
            prioridad: this.prioridad,
            estimacion: this.estimacion || undefined,
            criteriosAceptacion: this.criteriosAceptacion.filter(c => c.trim() !== '')
        };

        this.historias.push(historia);
        this.resetForm();
        this.showForm = false;
    }

    verHistoria(historia: HistoriaUsuario) {
        this.selectedHistoria = historia;
    }

    closeModal() {
        this.selectedHistoria = null;
    }

    eliminarHistoria(id: string) {
        if (confirm('¿Estás seguro de eliminar esta historia de usuario?')) {
            this.historias = this.historias.filter(h => h.id !== id);
        }
    }

    getPrioridadColor(prioridad: string): string {
        switch (prioridad) {
            case 'alta': return 'prioridad-alta';
            case 'media': return 'prioridad-media';
            case 'baja': return 'prioridad-baja';
            default: return 'prioridad-default';
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    formatDateLong(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
