// poner las rutas de la aplicación aquí
import { Routes } from '@angular/router';
import { CasosUsoComponent } from './Admin/CasosUso/cu.component';
import { ProyectosComponent } from './Admin/Proyecto/proyecto.component';

export const routes: Routes = [
    { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
    { path: 'cu', component: CasosUsoComponent },
    { path: 'proyectos', component: ProyectosComponent },
    { path: '**', redirectTo: '/proyectos' },
];
