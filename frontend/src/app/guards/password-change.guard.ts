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
export class PasswordChangeGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();

    // Se l'utente non è autenticato, lascia che auth guard gestisca
    if (!user) {
      return true;
    }

    // Se l'utente deve cambiare password e non è già nella pagina di cambio password
    if (user.mustChangePassword && state.url !== '/change-password') {
      this.router.navigate(['/change-password']);
      return false;
    }

    return true;
  }
}
