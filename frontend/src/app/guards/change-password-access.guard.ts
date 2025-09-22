import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChangePasswordAccessGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Allow access if user can access change-password page
    if (this.authService.canAccessChangePassword()) {
      return true;
    }

    // If not authenticated and doesn't need password change, redirect to login
    this.router.navigate(['/login']);
    return false;
  }
}
