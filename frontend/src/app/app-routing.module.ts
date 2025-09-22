import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChangePasswordComponent } from './components/auth/change-password/change-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { PasswordChangeGuard } from './guards/password-change.guard';
import { ChangePasswordAccessGuard } from './guards/change-password-access.guard';

const routes: Routes = [
  { path: '', redirectTo: '/flights/search', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [ChangePasswordAccessGuard],
  },
  {
    path: 'flights',
    loadChildren: () =>
      import('./modules/flights/flights.module').then((m) => m.FlightsModule),
  },
  {
    path: 'passenger',
    loadChildren: () =>
      import('./modules/passenger/passenger.module').then(
        (m) => m.PassengerModule
      ),
    canActivate: [AuthGuard, PasswordChangeGuard],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard, PasswordChangeGuard],
  },
  {
    path: 'airline',
    loadChildren: () =>
      import('./modules/airline/airline.module').then((m) => m.AirlineModule),
    canActivate: [AuthGuard, PasswordChangeGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard, PasswordChangeGuard],
  },
  { path: 'unauthorized', redirectTo: '/login' },
  { path: '**', redirectTo: '/flights/search' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
