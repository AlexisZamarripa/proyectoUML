import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraComponent } from '../barra/barra.component';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, BarraComponent],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    isBarraOpen = false;

    toggleBarra() {
        this.isBarraOpen = !this.isBarraOpen;

        // Agregar/quitar clase al body para empujar el contenido
        if (this.isBarraOpen) {
            document.body.classList.add('barra-open');
        } else {
            document.body.classList.remove('barra-open');
        }
    }

    closeBarra() {
        this.isBarraOpen = false;
        document.body.classList.remove('barra-open');
    }
}