import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    isBarraOpen = false;

    constructor(public themeService: ThemeService) { }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    toggleBarra() {
        this.isBarraOpen = !this.isBarraOpen;
    }

    closeBarra() {
        this.isBarraOpen = false;
    }
}

// Servicio de tema (asegúrate de tenerlo en tu aplicación)
import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkMode = signal(false);

    constructor() {
        // Cargar preferencia guardada
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

        this.darkMode.set(isDark);
        this.applyTheme(isDark);
    }

    isDarkMode() {
        return this.darkMode();
    }

    toggleTheme() {
        const newValue = !this.darkMode();
        this.darkMode.set(newValue);
        this.applyTheme(newValue);
        localStorage.setItem('theme', newValue ? 'dark' : 'light');
    }

    private applyTheme(isDark: boolean) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
}