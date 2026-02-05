import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-barra',
    templateUrl: './barra.component.html',
    styleUrls: ['./barra.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class BarraComponent implements OnInit {
    isExpanded = false;
    currentRoute = '';
    encuestasCount = 0;
    focusGroupsCount = 1;
    historiasCount = 1;
    catalogoCount = 1;

    constructor(private router: Router) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.updateCurrentRoute(event.url);
            });
    }

    ngOnInit(): void {
        this.updateCurrentRoute(this.router.url);
    }

    updateCurrentRoute(url: string): void {
        const segments = url.split('/').filter(segment => segment);
        this.currentRoute = segments[0] || 'proyectos';
    }

    navigateToProyectos(): void {
        this.router.navigate(['/proyectos']);
    }

    navigateToEntrevistas(): void {
        this.router.navigate(['/entrevistas']);
    }

    navigateToCU(): void {
        this.router.navigate(['/cu']);
    }

    toggleSidebar(): void {
        this.isExpanded = !this.isExpanded;

        const event = new CustomEvent('barra-expanded', {
            detail: { expanded: this.isExpanded }
        });
        window.dispatchEvent(event);
    }

    onProjectHeaderClick(): void {
        console.log('Cambiar de proyecto');
    }

    isActive(route: string): boolean {
        return this.currentRoute === route;
    }
}