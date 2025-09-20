import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';
import { AirlineManagementComponent } from './components/airline-management/airline-management.component';
import { RoleGuard } from '../../guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'admin' },
  },
  {
    path: 'profile',
    component: AdminProfileComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'admin' },
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'admin' },
  },
  {
    path: 'airlines',
    component: AirlineManagementComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'admin' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
