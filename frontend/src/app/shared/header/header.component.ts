import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isUserMenuOpen = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isAirline(): boolean {
    return this.authService.isAirline();
  }

  isPassenger(): boolean {
    return this.authService.isPassenger();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToFlights(): void {
    this.router.navigate(['/flights/search']);
    this.closeMobileMenu();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMobileMenu();
  }

  navigateToAdmin(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin']);
      this.closeMobileMenu();
    }
  }

  navigateToUserManagement(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/users']);
      this.closeMobileMenu();
    }
  }

  navigateToAirline(): void {
    if (this.isAirline()) {
      this.router.navigate(['/airline']);
      this.closeMobileMenu();
    }
  }

  navigateToFlightManagement(): void {
    if (this.isAirline()) {
      this.router.navigate(['/airline/flights']);
      this.closeMobileMenu();
    }
  }

  navigateToBookings(): void {
    if (this.isPassenger()) {
      this.router.navigate(['/passenger/bookings']);
      this.closeMobileMenu();
    }
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const firstInitial = this.currentUser.firstName?.charAt(0) || '';
    const lastInitial = this.currentUser.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getUserRoleText(): string {
    if (!this.currentUser) return '';
    
    const roleTexts: { [key: string]: string } = {
      'admin': 'Amministratore',
      'airline': 'Compagnia Aerea',
      'passenger': 'Passeggero'
    };
    
    return roleTexts[this.currentUser.role] || this.currentUser.role;
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.isUserMenuOpen = false;
  }

  private closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
