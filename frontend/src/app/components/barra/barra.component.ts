import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

interface NavItem {
    id: string;
    label: string;
    route: string;
    color: string;
    bgHover: string;
    count: number | null;
}

@Component({
    selector: 'app-barra',
    standalone: true,
    imports: [CommonModule, RouterLink ],
    templateUrl: './barra.component.html',
    styleUrls: ['./barra.component.css']
})
export class BarraComponent implements OnInit, OnDestroy {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    isCollapsed = false;

    items: NavItem[] = [
        {
            id: 'proyectos',
            label: 'Proyectos',
            route: '/proyectos',
            color: 'text-gray-600',
            bgHover: 'bg-gray-100',
            count: null
        },
        {
            id: 'entrevistas',
            label: 'Entrevistas',
            route: '/entrevistas',
            color: 'text-blue-600',
            bgHover: 'bg-blue-50',
            count: null
        },
        {
            id: 'encuestas',
            label: 'Encuestas',
            route: '/encuestas',
            color: 'text-green-600',
            bgHover: 'bg-green-50',
            count: null
        },
        {
            id: 'observaciones',
            label: 'Observaciones',
            route: '/observaciones',
            color: 'text-purple-600',
            bgHover: 'bg-purple-50',
            count: null
        },
        {
            id: 'focus-group',
            label: 'Focus Groups',
            route: '/focus-group',
            color: 'text-orange-600',
            bgHover: 'bg-orange-50',
            count: null
        },
        {
            id: 'historia-usuario',
            label: 'Historias de Usuario',
            route: '/cu',
            color: 'text-pink-600',
            bgHover: 'bg-pink-50',
            count: null
        },
        {
            id: 'documentos',
            label: 'Catálogo de Documentos',
            route: '/documentos',
            color: 'text-yellow-600',
            bgHover: 'bg-yellow-50',
            count: null
        },
        {
            id: 'seguimiento',
            label: 'Seguimiento Transaccional',
            route: '/seguimiento',
            color: 'text-indigo-600',
            bgHover: 'bg-indigo-50',
            count: null
        }
    ];

    constructor(public router: Router) {}

    closeBarra() {
        this.close.emit();
        document.body.classList.remove('barra-open');
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        if (this.isCollapsed) {
            document.body.classList.add('barra-collapsed');
            document.body.classList.remove('barra-expanded');
        } else {
            document.body.classList.add('barra-expanded');
            document.body.classList.remove('barra-collapsed');
        }
    }

    ngOnInit() {
        // Establecer el estado inicial en desktop
        if (window.innerWidth >= 1024) {
            document.body.classList.add('barra-expanded');
        }
    }

    ngOnDestroy() {
        document.body.classList.remove('barra-expanded', 'barra-collapsed');
    }

    getTotalCount(): number {
        return this.items.reduce((total, item) => total + (item.count || 0), 0);
    }

    isActiveRoute(route: string): boolean {
        return this.router.url === route;
    }
}