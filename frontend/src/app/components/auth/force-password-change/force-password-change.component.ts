import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-force-password-change',
  templateUrl: './force-password-change.component.html',
  styleUrls: ['./force-password-change.component.scss']
})
export class ForcePasswordChangeComponent implements OnInit {
  passwordForm: FormGroup;
  loading = false;
  error = '';
  email = '';
  temporaryPassword = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.passwordForm = this.formBuilder.group({
      temporaryPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get email from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/login']);
      }
    });
  }

  get f() { return this.passwordForm.controls; }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const changePasswordData = {
      email: this.email,
      temporaryPassword: this.passwordForm.value.temporaryPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.forceChangePassword(changePasswordData).subscribe({
      next: (response) => {
        if (response.success) {
          // Redirect based on user role
          const user = this.authService.getCurrentUser();
          if (user?.role === 'airline') {
            this.router.navigate(['/airline']);
          } else if (user?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/passenger']);
          }
        } else {
          this.error = response.message || 'Password change failed';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'An error occurred during password change';
        this.loading = false;
      }
    });
  }
}