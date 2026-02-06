// poner las rutas de la aplicación aquí
import { Routes } from '@angular/router';
import { CasosUsoComponent } from './Admin/CasosUso/cu.component';
import { ProyectosComponent } from './Admin/Proyecto/proyecto.component';
import { EntrevistaComponent } from './Admin/Entrevista/entrevista.component';
import { StakeholderComponent } from './Admin/stakeholder/stakeholder.component';
import { ProcesosComponent } from './Admin/procesos/procesos.component';

export const routes: Routes = [
    { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
    { path: 'cu', component: CasosUsoComponent },
    { path: 'proyectos', component: ProyectosComponent },
    { path: 'proyecto/:id/stakeholders', component: StakeholderComponent },
    { path: 'proyecto/:id/procesos', component: ProcesosComponent },
    { path: 'entrevistas', component: EntrevistaComponent },
    { path: '**', redirectTo: '/proyectos' },
];
