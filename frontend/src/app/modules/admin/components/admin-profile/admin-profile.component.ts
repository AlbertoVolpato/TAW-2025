import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';
import { SystemStats } from '../../../../models/admin.model';

interface RecentActivity {
  id: string;
  type:
    | 'user_registration'
    | 'airline_invite'
    | 'route_created'
    | 'system_config'
    | 'booking_created';
  description: string;
  timestamp: Date;
  userId?: string;
}

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
})
export class AdminProfileComponent implements OnInit {
  @ViewChild('airlineInviteDialog') airlineInviteDialog!: TemplateRef<any>;

  adminUser: User | null = null;
  systemStats: SystemStats | null = null;
  recentActivities: RecentActivity[] = [];
  loading = false;
  sendingInvite = false;

  inviteForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.inviteForm = this.fb.group({
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      iataCode: [''],
      message: [
        'Benvenuto nel nostro sistema di gestione voli. Ti invitiamo a registrare la tua compagnia aerea per iniziare ad operare sulla nostra piattaforma.',
      ],
    });
  }

  ngOnInit(): void {
    this.loadAdminData();
    this.loadSystemStats();
    this.loadRecentActivities();
  }

  private loadAdminData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      this.adminUser = currentUser;
    }
  }

  private loadSystemStats(): void {
    this.loading = true;
    this.adminService.getSystemStats().subscribe({
      next: (response) => {
        this.systemStats = response.data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading system stats:', error);
        this.loading = false;
        this.snackBar.open(
          'Errore nel caricamento delle statistiche',
          'Chiudi',
          {
            duration: 3000,
          }
        );
      },
    });
  }

  private loadRecentActivities(): void {
    this.adminService.getRecentActivities().subscribe({
      next: (activities: any[]) => {
        this.recentActivities = activities;
      },
      error: (error: any) => {
        console.error('Error loading recent activities:', error);
      },
    });
  }

  openAirlineInviteDialog(): void {
    const dialogRef = this.dialog.open(this.airlineInviteDialog, {
      width: '600px',
      maxWidth: '90vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.inviteForm.reset({
          message:
            'Benvenuto nel nostro sistema di gestione voli. Ti invitiamo a registrare la tua compagnia aerea per iniziare ad operare sulla nostra piattaforma.',
        });
      }
    });
  }

  sendAirlineInvite(): void {
    if (this.inviteForm.valid) {
      this.sendingInvite = true;
      const inviteData = this.inviteForm.value;

      this.adminService.sendAirlineInvite(inviteData).subscribe({
        next: (response: any) => {
          this.sendingInvite = false;
          this.snackBar.open('Invito inviato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.dialog.closeAll();
          this.loadSystemStats(); // Refresh stats
          this.loadRecentActivities(); // Refresh activities
        },
        error: (error: any) => {
          this.sendingInvite = false;
          console.error('Error sending airline invite:', error);
          this.snackBar.open("Errore nell'invio dell'invito", 'Chiudi', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  openRouteManagement(): void {
    this.router.navigate(['/admin/routes']);
  }

  exportUsers(): void {
    this.adminService.exportUsers('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting users:', error);
        this.snackBar.open("Errore durante l'esportazione", 'Chiudi', {
          duration: 3000,
        });
      },
    });
  }

  openSystemConfig(): void {
    this.snackBar.open(
      'Funzionalità configurazione sistema in sviluppo',
      'Chiudi',
      {
        duration: 3000,
      }
    );
    // TODO: Implementare configurazione sistema
  }

  openReports(): void {
    this.snackBar.open(
      'Funzionalità report e statistiche in sviluppo',
      'Chiudi',
      {
        duration: 3000,
      }
    );
    // TODO: Implementare report e analytics
  }

  openAuditLogs(): void {
    this.snackBar.open('Funzionalità log attività in sviluppo', 'Chiudi', {
      duration: 3000,
    });
    // TODO: Implementare audit logs
  }

  getActivityIcon(type: string): string {
    const icons = {
      user_registration: 'person_add',
      airline_invite: 'send',
      route_created: 'route',
      system_config: 'settings',
      booking_created: 'confirmation_number',
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getActivityIconClass(type: string): string {
    const classes = {
      user_registration: 'activity-user',
      airline_invite: 'activity-invite',
      route_created: 'activity-route',
      system_config: 'activity-config',
      booking_created: 'activity-booking',
    };
    return classes[type as keyof typeof classes] || 'activity-default';
  }

  formatActivityTime(timestamp: Date): string {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now.getTime() - activity.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Ora';
    if (diffMinutes < 60) return `${diffMinutes} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return activity.toLocaleDateString('it-IT');
  }

  refreshData(): void {
    this.loadSystemStats();
    this.loadRecentActivities();
  }
}
