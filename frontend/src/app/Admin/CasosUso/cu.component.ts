import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FlujoAlterno {
    codigo: string;
    pasos: string[];
}

interface CasoDeUso {
    id?: number;
    nombre: string;
    descripcion: string;
    actores: string[];
    precondiciones: string[];
    flujoBasico: string[];
    flujosAlternos: FlujoAlterno[];
    postcondiciones: string[];
    puntosExtension: string[];
    prioridad: string;
}

@Component({
    selector: 'app-casos-uso',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cu.component.html',
    styleUrls: ['./cu.component.css']
})
export class CasosUsoComponent {
    isModalOpen = false;
    isEditing = false;
    casosDeUso: CasoDeUso[] = [];

    casoActual: CasoDeUso = this.getEmptyCaso();

    getEmptyCaso(): CasoDeUso {
        return {
            nombre: '',
            descripcion: '',
            actores: [''],
            precondiciones: [''],
            flujoBasico: [''],
            flujosAlternos: [],
            postcondiciones: [''],
            puntosExtension: [''],
            prioridad: 'Media'
        };
    }

    openModal() {
        this.isModalOpen = true;
        this.isEditing = false;
        this.casoActual = this.getEmptyCaso();
    }

    closeModal() {
        this.isModalOpen = false;
        this.casoActual = this.getEmptyCaso();
    }

    guardarCaso() {
        // Limpiar campos vacíos antes de guardar
        this.casoActual.actores = this.casoActual.actores.filter(a => a.trim() !== '');
        this.casoActual.precondiciones = this.casoActual.precondiciones.filter(p => p.trim() !== '');
        this.casoActual.flujoBasico = this.casoActual.flujoBasico.filter(f => f.trim() !== '');
        this.casoActual.postcondiciones = this.casoActual.postcondiciones.filter(p => p.trim() !== '');
        this.casoActual.puntosExtension = this.casoActual.puntosExtension.filter(p => p.trim() !== '');

        // Limpiar flujos alternos vacíos
        this.casoActual.flujosAlternos = this.casoActual.flujosAlternos.filter(fa => {
            fa.pasos = fa.pasos.filter(p => p.trim() !== '');
            return fa.codigo.trim() !== '' && fa.pasos.length > 0;
        });

        if (this.isEditing) {
            const index = this.casosDeUso.findIndex(c => c.id === this.casoActual.id);
            if (index !== -1) {
                this.casosDeUso[index] = JSON.parse(JSON.stringify(this.casoActual));
            }
        } else {
            this.casoActual.id = Date.now();
            this.casosDeUso.push(JSON.parse(JSON.stringify(this.casoActual)));
        }
        this.closeModal();
    }

    editarCaso(caso: CasoDeUso) {
        this.isModalOpen = true;
        this.isEditing = true;
        // Deep copy para evitar problemas de referencia
        this.casoActual = JSON.parse(JSON.stringify(caso));
    }

    eliminarCaso(caso: CasoDeUso) {
        if (confirm('¿Estás seguro de eliminar este caso de uso?')) {
            const index = this.casosDeUso.findIndex(c => c.id === caso.id);
            if (index !== -1) {
                this.casosDeUso.splice(index, 1);
            }
        }
    }

    addItem(array: string[], defaultValue: string) {
        array.push(defaultValue);
    }

    removeItem(array: any[], index: number) {
        array.splice(index, 1);
    }

    addFlujoAlterno() {
        this.casoActual.flujosAlternos.push({
            codigo: `FA0${this.casoActual.flujosAlternos.length + 1}`,
            pasos: ['']
        });
    }

    // TrackBy functions para optimizar el rendimiento de *ngFor
    trackByIndex(index: number): number {
        return index;
    }

    trackByFlujoAlterno(index: number, item: FlujoAlterno): string {
        return item.codigo + '-' + index;
    }

    trackByCaso(index: number, item: CasoDeUso): number {
        return item.id || index;
    }
}