import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

// Routing
import { AdminRoutingModule } from './admin-routing.module';

// Components
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';
import { AirlineInvitationDialogComponent } from './components/airline-invitation-dialog/airline-invitation-dialog.component';
import { AirlineManagementComponent } from './components/airline-management/airline-management.component';

@NgModule({
  declarations: [
    UserManagementComponent,
    AdminProfileComponent,
    AirlineInvitationDialogComponent,
    AirlineManagementComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AdminRoutingModule,

    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
})
export class AdminModule {}
