import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('slideDown', [
      state('true', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('false', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      transition('false => true', animate('200ms ease-out')),
      transition('true => false', animate('150ms ease-in'))
    ])
  ]
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;

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

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToFlights(): void {
    this.router.navigate(['/flights/search']);
    this.isMenuOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.isMenuOpen = false;
  }

  navigateToAdmin(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin']);
      this.isMenuOpen = false;
    }
  }

  navigateToAirline(): void {
    if (this.isAirline()) {
      this.router.navigate(['/airline']);
      this.isMenuOpen = false;
    }
  }

  navigateToBookings(): void {
    if (this.isPassenger()) {
      this.router.navigate(['/passenger/bookings']);
      this.isMenuOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen = false;
  }
}
