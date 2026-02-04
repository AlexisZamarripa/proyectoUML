import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-barra',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './barra.component.html',
    styleUrls: ['./barra.component.css']
})
export class BarraComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    closeBarra() {
        this.close.emit();
        document.body.classList.remove('barra-open');
    }
}