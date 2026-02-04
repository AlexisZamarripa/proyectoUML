import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string;
    creador: string;
    gradient: string;
    fechaCreacion: Date;
    stats: {
        casos: number;
        entrevistas: number;
        documentos: number;
        diagramas: number;
    };
}

@Component({
    selector: 'app-proyectos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './proyecto.component.html',
    styleUrls: ['./proyecto.component.css']
})
export class ProyectosComponent implements OnInit {

    proyectos: Proyecto[] = [
        {
            id: 1,
            nombre: 'dfas',
            descripcion: 'asdas',
            creador: 'Usuario Demo',
            gradient: 'gradient-1',
            fechaCreacion: new Date(),
            stats: {
                casos: 0,
                entrevistas: 0,
                documentos: 0,
                diagramas: 0
            }
        }
    ];

    modalNuevoProyectoAbierto = false;
    modalEditarProyectoAbierto = false;
    modalConfirmacionAbierto = false;
    menuAbierto: number | null = null;

    nuevoProyecto: Proyecto = this.inicializarNuevoProyecto();
    proyectoEditando: Proyecto | null = null;
    proyectoAEliminar: Proyecto | null = null;

    gradientesDisponibles = [
        { value: 'gradient-1', label: 'Rojo - Naranja' },
        { value: 'gradient-2', label: 'Azul - Cyan' },
        { value: 'gradient-3', label: 'Púrpura - Rosa' },
        { value: 'gradient-4', label: 'Verde - Cyan' },
        { value: 'gradient-5', label: 'Naranja - Amarillo' }
    ];

    constructor() { }

    ngOnInit(): void { }

    private inicializarNuevoProyecto(): Proyecto {
        return {
            id: 0,
            nombre: '',
            descripcion: '',
            creador: '',
            gradient: 'gradient-1',
            fechaCreacion: new Date(),
            stats: {
                casos: 0,
                entrevistas: 0,
                documentos: 0,
                diagramas: 0
            }
        };
    }

    abrirModalNuevoProyecto(): void {
        this.modalNuevoProyectoAbierto = true;
        this.nuevoProyecto = this.inicializarNuevoProyecto();
    }

    cerrarModalNuevoProyecto(): void {
        this.modalNuevoProyectoAbierto = false;
        this.nuevoProyecto = this.inicializarNuevoProyecto();
    }

    crearProyecto(): void {
        if (!this.nuevoProyecto.nombre || !this.nuevoProyecto.descripcion || !this.nuevoProyecto.creador) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        this.nuevoProyecto.id = this.proyectos.length > 0
            ? Math.max(...this.proyectos.map(p => p.id)) + 1
            : 1;

        this.proyectos.push({ ...this.nuevoProyecto });
        this.cerrarModalNuevoProyecto();
    }

    toggleMenu(proyectoId: number, event: Event): void {
        event.stopPropagation();
        this.menuAbierto = this.menuAbierto === proyectoId ? null : proyectoId;
    }

    cerrarMenu(): void {
        this.menuAbierto = null;
    }

    abrirModalEditar(proyectoId: number): void {
        const proyecto = this.proyectos.find(p => p.id === proyectoId);
        if (proyecto) {
            this.proyectoEditando = { ...proyecto };
            this.modalEditarProyectoAbierto = true;
            this.cerrarMenu();
        }
    }

    cerrarModalEditar(): void {
        this.modalEditarProyectoAbierto = false;
        this.proyectoEditando = null;
    }

    guardarEdicion(): void {
        if (!this.proyectoEditando) return;

        if (!this.proyectoEditando.nombre || !this.proyectoEditando.descripcion || !this.proyectoEditando.creador) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        const index = this.proyectos.findIndex(p => p.id === this.proyectoEditando!.id);
        if (index !== -1) {
            this.proyectos[index] = { ...this.proyectoEditando };
        }

        this.cerrarModalEditar();
    }

    abrirModalConfirmacion(proyectoId: number): void {
        const proyecto = this.proyectos.find(p => p.id === proyectoId);
        if (proyecto) {
            this.proyectoAEliminar = proyecto;
            this.modalConfirmacionAbierto = true;
            this.cerrarMenu();
        }
    }

    cerrarModalConfirmacion(): void {
        this.modalConfirmacionAbierto = false;
        this.proyectoAEliminar = null;
    }

    confirmarEliminacion(): void {
        if (this.proyectoAEliminar) {
            this.proyectos = this.proyectos.filter(p => p.id !== this.proyectoAEliminar!.id);
            this.cerrarModalConfirmacion();
        }
    }

    abrirProyecto(proyectoId: number): void {
        const proyecto = this.proyectos.find(p => p.id === proyectoId);
        console.log('Abriendo proyecto:', proyecto);
    }

}