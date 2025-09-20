import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent } from './components/booking/booking.component';
import { BookingListComponent } from './components/booking-list/booking-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { BookingDetailComponent } from './components/booking-detail/booking-detail.component';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'bookings',
    pathMatch: 'full',
  },
  {
    path: 'bookings',
    component: BookingListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'bookings/new/:flightId',
    component: BookingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'booking/:id',
    component: BookingDetailComponent,
    canActivate: [AuthGuard],
  },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PassengerRoutingModule {}
