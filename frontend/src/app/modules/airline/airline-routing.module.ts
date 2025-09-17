import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AirlineDashboardComponent } from './components/airline-dashboard/airline-dashboard.component';
import { FlightManagementComponent } from './components/flight-management/flight-management.component';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AirlineDashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'airline' }
  },
  {
    path: 'flights',
    component: FlightManagementComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'airline' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AirlineRoutingModule { }