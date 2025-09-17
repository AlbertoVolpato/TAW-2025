import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChangePasswordComponent } from './components/auth/change-password/change-password.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/flights/search', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'change-password', 
    component: ChangePasswordComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'flights', 
    loadChildren: () => import('./modules/flights/flights.module').then(m => m.FlightsModule)
  },
  { 
    path: 'passenger', 
    loadChildren: () => import('./modules/passenger/passenger.module').then(m => m.PassengerModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'airline', 
    loadChildren: () => import('./modules/airline/airline.module').then(m => m.AirlineModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile', 
    redirectTo: '/passenger/profile', 
    pathMatch: 'full'
  },
  { path: 'unauthorized', redirectTo: '/login' },
  { path: '**', redirectTo: '/flights/search' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
