import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isBarraOpen = false;
  
  // Inyectar el servicio de tema para que se inicialice al cargar la app
  private themeService = inject(ThemeService);

  onBarraToggle(isOpen: boolean) {
    this.isBarraOpen = isOpen;
  }
}