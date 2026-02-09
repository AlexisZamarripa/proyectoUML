// poner las rutas de la aplicación aquí
import { Routes } from '@angular/router';
import { CasosUsoComponent } from './Admin/CasosUso/cu.component';
import { ProyectosComponent } from './Admin/Proyecto/proyecto.component';
import { EntrevistaComponent } from './Admin/Entrevista/entrevista.component';
import { EncuestaComponent } from './Admin/Encuestas/encuesta.component';
import { ObservacionComponent } from './Admin/Observaciones/observacion.component';
import { StakeholderComponent } from './Admin/stakeholder/stakeholder.component';
import { ProcesosComponent } from './Admin/procesos/procesos.component';
import { DocumentosComponent } from './Admin/Documentos/doc.component';
import { FocusGroupComponent } from './Admin/FocusGroup/focusgroup.component';
import { SeguimientoComponent } from './Admin/SeguimientoTrans/seguimiento.component';

export const routes: Routes = [
    { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
    { path: 'proyectos', component: ProyectosComponent },
    { path: 'proyecto/:id/stakeholders', component: StakeholderComponent },
    { path: 'proyecto/:id/procesos', component: ProcesosComponent },
    { path: 'proyecto/:id/entrevistas', component: EntrevistaComponent },
    { path: 'proyecto/:id/encuestas', component: EncuestaComponent },
    { path: 'proyecto/:id/observaciones', component: ObservacionComponent },
    { path: 'proyecto/:id/focus-groups', component: FocusGroupComponent },
    { path: 'proyecto/:id/historias', component: CasosUsoComponent },
    { path: 'proyecto/:id/documentos', component: DocumentosComponent },
    { path: 'proyecto/:id/seguimiento', component: SeguimientoComponent },
    { path: '**', redirectTo: '/proyectos' },
];
