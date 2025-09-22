import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AirlineDashboardComponent } from './components/airline-dashboard/airline-dashboard.component';
import { FlightManagementComponent } from './components/flight-management/flight-management.component';
import { AirlineRouteManagementComponent } from './components/route-management/airline-route-management.component';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AirlineDashboardComponent,
  },
  {
    path: 'flights',
    component: FlightManagementComponent,
  },
  {
    path: 'routes',
    component: AirlineRouteManagementComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AirlineRoutingModule {}
