import { Component, inject, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { BarraComponent } from './components/barra/barra.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, BarraComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isBarraExpanded = false;
  private renderer = inject(Renderer2);

  constructor() {
    // Escuchar cambios en el estado de la barra
    window.addEventListener('barra-expanded', ((event: CustomEvent) => {
      this.isBarraExpanded = event.detail.expanded;

      if (this.isBarraExpanded) {
        this.renderer.addClass(document.body, 'barra-expanded');
      } else {
        this.renderer.removeClass(document.body, 'barra-expanded');
      }
    }) as EventListener);
  }
}