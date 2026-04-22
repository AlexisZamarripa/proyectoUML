import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  // Inyectar el servicio de tema para que se inicialice al cargar la app
  private themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private routerEventsSub?: Subscription;

  ngOnInit(): void {
    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const state = history.state as { preserveScroll?: boolean; scrollY?: number };
        if (!state.preserveScroll || typeof state.scrollY !== 'number') {
          return;
        }

        requestAnimationFrame(() => {
          window.scrollTo({ top: state.scrollY, left: 0, behavior: 'auto' });
        });
      });
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }
}