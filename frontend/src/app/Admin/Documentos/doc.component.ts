import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BarraComponent } from '../../components/barra/barra.component';
import { ConfirmModalComponent, ConfirmModalConfig } from '../../components/confirm-modal/confirm-modal.component';
import { ProyectoApiService } from '../../services/proyecto-api.service';
import { DocumentoApiService, CreateDocumentoDto, UpdateDocumentoDto } from '../../services/documento-api.service';
import { ProcesoApiService, Proceso, Subproceso } from '../../services/proceso-api.service';

interface Documento {
    nombre: string;
    tipo: string;
    url: string;
    descripcion: string;
    isDragging?: boolean;
}

interface AnalisisDocumento {
    id: string;
    titulo: string;
    fecha?: string;
    tipoDocumento: string;
    fuente: string;
    proceso: string;
    subproceso: string;
    id_proceso?: number;
    id_subproceso?: number;
    documentos: Documento[];
    hallazgos: string[];
    recomendaciones: string;
}

@Component({
    selector: 'app-documentos',
    standalone: true,
    imports: [CommonModule, FormsModule, BarraComponent, ConfirmModalComponent],
    templateUrl: './doc.component.html',
    styleUrls: ['./doc.component.css']
})
export class DocumentosComponent implements OnInit {
    showForm = false;
    analisis: AnalisisDocumento[] = [];
    isEditMode = false;
    analisisEditando: string | null = null;

    // Modales
    showDetailModal = false;
    selectedAnalisis: AnalisisDocumento | null = null;
    showConfirmModal = false;
    analisisToDelete: string | null = null;
    confirmModalConfig: ConfirmModalConfig = {
        title: '¿Eliminar análisis?',
        message: 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este análisis de documentos?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
        icon: 'trash'
    };

    // Proyecto actual
    proyecto = {
        id: '',
        nombre: '',
        descripcion: '',
        color: 'blue'
    };

    // Active tab in project sidebar
    activeTab = 'documentos';

    // Procesos y subprocesos disponibles
    procesos: Proceso[] = [];
    subprocesos: Subproceso[] = [];

    // Campos del formulario
    titulo = '';
    tipoDocumento = '';
    fuente = '';
    procesoId: number | null = null;
    subprocesoId: number | null = null;
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
        private proyectoApiService: ProyectoApiService,
        private documentoApiService: DocumentoApiService,
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

            // Cargar procesos del proyecto
            this.procesoApiService.getProcesosByProyecto(Number(id)).subscribe({
                next: (procesos) => {
                    this.procesos = procesos;
                },
                error: (error) => console.error('Error al cargar procesos:', error)
            });

            // Cargar análisis de documentos existentes
            this.cargarAnalisis();
        }
    }

    cargarAnalisis(): void {
        if (!this.proyecto.id) return;
        this.documentoApiService.getByProyecto(Number(this.proyecto.id)).subscribe({
            next: (data) => {
                this.analisis = data.map(item => ({
                    id: item.id,
                    titulo: item.titulo,
                    tipoDocumento: item.tipoDocumento,
                    fuente: item.fuente,
                    proceso: this.getNombreProceso(item.id_proceso),
                    subproceso: this.getNombreSubproceso(item.id_subproceso),
                    id_proceso: item.id_proceso,
                    id_subproceso: item.id_subproceso,
                    documentos: item.documentos || [],
                    hallazgos: item.hallazgos || [],
                    recomendaciones: item.recomendaciones || ''
                }));
            },
            error: (error) => console.error('Error al cargar análisis:', error)
        });
    }

    onProcesoChange(): void {
        this.subprocesoId = null;
        this.subprocesos = [];
        if (this.procesoId) {
            const proceso = this.procesos.find(p => Number(p.id) === this.procesoId);
            if (proceso && proceso.subprocesos) {
                this.subprocesos = proceso.subprocesos;
            }
        }
    }

    getNombreProceso(idProceso: number | undefined): string {
        if (!idProceso) return '';
        const p = this.procesos.find(proc => Number(proc.id) === idProceso);
        return p ? p.nombre : '';
    }

    getNombreSubproceso(idSubproceso: number | undefined): string {
        if (!idSubproceso) return '';
        for (const proc of this.procesos) {
            if (proc.subprocesos) {
                const sub = proc.subprocesos.find(s => Number(s.id) === idSubproceso);
                if (sub) return sub.nombre;
            }
        }
        return '';
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
                  this.tipoDocumento && this.tipoDocumento.trim().length > 0 &&
                  this.procesoId && this.subprocesoId);
    }

    resetForm() {
        this.titulo = '';
        this.tipoDocumento = '';
        this.fuente = '';
        this.procesoId = null;
        this.subprocesoId = null;
        this.subprocesos = [];
        this.documentos = [{ nombre: '', tipo: '', url: '', descripcion: '' }];
        this.hallazgos = [''];
        this.recomendaciones = '';
        this.isEditMode = false;
        this.analisisEditando = null;
    }

    handleSubmit() {
        if (!this.isFormValid()) {
            return;
        }

        // Limpiar documentos y hallazgos vacíos
        // Eliminar isDragging y otras propiedades internas antes de enviar al backend
        const docsLimpios = this.documentos
            .filter(d => d.nombre.trim() !== '')
            .map(({ nombre, tipo, url, descripcion }) => ({ nombre, tipo, url, descripcion }));
        const hallazgosLimpios = this.hallazgos.filter(h => h.trim() !== '');

        if (this.isEditMode && this.analisisEditando) {
            // Actualizar análisis existente
            const updateDto: UpdateDocumentoDto = {
                titulo_analisis: this.titulo.trim(),
                tipo_documento: this.tipoDocumento.trim(),
                fuente: this.fuente.trim() || undefined,
                id_proceso: this.procesoId!,
                id_subproceso: this.subprocesoId!,
                documentos: docsLimpios.length > 0 ? docsLimpios : undefined,
                hallazgos: hallazgosLimpios.length > 0 ? hallazgosLimpios : undefined,
                recomendaciones: this.recomendaciones.trim() || undefined
            };

            this.documentoApiService.update(Number(this.analisisEditando), updateDto).subscribe({
                next: () => {
                    this.resetForm();
                    this.showForm = false;
                    this.cargarAnalisis();
                },
                error: (error) => console.error('Error al actualizar análisis:', error)
            });
        } else {
            // Crear nuevo análisis
            const createDto: CreateDocumentoDto = {
                id_proyecto: Number(this.proyecto.id),
                id_proceso: this.procesoId!,
                id_subproceso: this.subprocesoId!,
                titulo_analisis: this.titulo.trim(),
                tipo_documento: this.tipoDocumento.trim(),
                fuente: this.fuente.trim() || undefined,
                documentos: docsLimpios.length > 0 ? docsLimpios : undefined,
                hallazgos: hallazgosLimpios.length > 0 ? hallazgosLimpios : undefined,
                recomendaciones: this.recomendaciones.trim() || undefined
            };

            this.documentoApiService.create(createDto).subscribe({
                next: () => {
                    this.resetForm();
                    this.showForm = false;
                    this.cargarAnalisis();
                },
                error: (error) => console.error('Error al crear análisis:', error)
            });
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

    trackByIndex(index: number): number {
        return index;
    }

    trackByAnalisis(index: number, item: AnalisisDocumento): string {
        return item.id;
    }

    // Métodos del modal de detalles
    verDetalles(analisis: AnalisisDocumento): void {
        this.selectedAnalisis = analisis;
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        setTimeout(() => {
            this.selectedAnalisis = null;
        }, 200);
    }

    stopPropagation(event: Event): void {
        event.stopPropagation();
    }

    editarAnalisis(analisis: AnalisisDocumento): void {
        this.isEditMode = true;
        this.analisisEditando = analisis.id;
        
        // Pre-llenar formulario
        this.titulo = analisis.titulo;
        this.tipoDocumento = analisis.tipoDocumento;
        this.fuente = analisis.fuente;
        this.procesoId = analisis.id_proceso || null;
        this.subprocesoId = analisis.id_subproceso || null;
        
        // Cargar subprocesos del proceso seleccionado
        if (this.procesoId) {
            const proceso = this.procesos.find(p => Number(p.id) === this.procesoId);
            if (proceso && proceso.subprocesos) {
                this.subprocesos = proceso.subprocesos;
            }
        }
        
        // Copiar documentos (sin isDragging)
        this.documentos = analisis.documentos.length > 0 
            ? analisis.documentos.map(d => ({ ...d, isDragging: false }))
            : [{ nombre: '', tipo: '', url: '', descripcion: '' }];
        
        // Copiar hallazgos
        this.hallazgos = analisis.hallazgos.length > 0 ? [...analisis.hallazgos] : [''];
        
        // Copiar recomendaciones
        this.recomendaciones = analisis.recomendaciones;
        
        // Mostrar formulario y scroll
        this.showForm = true;
        setTimeout(() => {
            const formCard = document.querySelector('.form-card');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    // Métodos del confirm modal
    eliminarAnalisis(id: string): void {
        this.analisisToDelete = id;
        this.showConfirmModal = true;
    }

    confirmarEliminacion(): void {
        if (this.analisisToDelete) {
            this.documentoApiService.delete(Number(this.analisisToDelete)).subscribe({
                next: () => {
                    this.analisis = this.analisis.filter(a => a.id !== this.analisisToDelete);
                    this.showConfirmModal = false;
                    this.analisisToDelete = null;
                },
                error: (error) => {
                    console.error('Error al eliminar análisis:', error);
                    this.showConfirmModal = false;
                    this.analisisToDelete = null;
                }
            });
        }
    }

    cancelarEliminacion(): void {
        this.showConfirmModal = false;
        this.analisisToDelete = null;
    }

    // Métodos de drag & drop y upload de archivos
    onDragOver(event: DragEvent, index: number): void {
        event.preventDefault();
        event.stopPropagation();
        this.documentos[index].isDragging = true;
    }

    onDragLeave(event: DragEvent, index: number): void {
        event.preventDefault();
        event.stopPropagation();
        this.documentos[index].isDragging = false;
    }

    onDrop(event: DragEvent, index: number): void {
        event.preventDefault();
        event.stopPropagation();
        this.documentos[index].isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0], index);
        }
    }

    triggerFileInput(index: number): void {
        const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFile(input.files[0], index);
        }
    }

    processFile(file: File, index: number): void {
        // Validar tamaño del archivo (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('El archivo es demasiado grande. Tamaño máximo: 10MB');
            return;
        }

        // Detectar tipo de archivo automáticamente
        const fileType = this.detectFileType(file.name);
        
        // Actualizar nombre y tipo
        this.documentos[index].nombre = file.name;
        this.documentos[index].tipo = fileType;

        // Subir archivo al servidor
        this.documentoApiService.uploadFile(file).subscribe({
            next: (res) => {
                this.documentos[index].url = res.url;
            },
            error: (err) => {
                console.error('Error al subir el archivo:', err);
                alert('Error al subir el archivo. Por favor, intenta de nuevo.');
                this.documentos[index].nombre = '';
                this.documentos[index].tipo = '';
            }
        });
    }

    detectFileType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        
        const typeMap: { [key: string]: string } = {
            'pdf': 'PDF',
            'doc': 'Word',
            'docx': 'Word',
            'xls': 'Excel',
            'xlsx': 'Excel',
            'ppt': 'PowerPoint',
            'pptx': 'PowerPoint',
            'txt': 'Texto',
            'jpg': 'Imagen',
            'jpeg': 'Imagen',
            'png': 'Imagen',
            'gif': 'Imagen',
            'bmp': 'Imagen',
            'svg': 'Imagen',
            'zip': 'Comprimido',
            'rar': 'Comprimido',
            '7z': 'Comprimido'
        };

        return typeMap[ext || ''] || 'Documento';
    }

    removeFile(index: number): void {
        this.documentos[index].url = '';
        this.documentos[index].nombre = '';
        this.documentos[index].tipo = '';
        
        // Limpiar el input file
        const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * Abrir un archivo subido en una nueva pestaña
     */
    abrirArchivo(url: string): void {
        if (url) {
            window.open(this.documentoApiService.getFileUrl(url), '_blank');
        }
    }
}
