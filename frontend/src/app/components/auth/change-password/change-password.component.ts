import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  forceChangeForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  isForceChange = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.changePasswordForm = this.formBuilder.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    this.forceChangeForm = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
        temporaryPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Check if user must change password
    const user = this.authService.getCurrentUser();
    this.isForceChange =
      user?.mustChangePassword ||
      this.authService.requiresPasswordChange() ||
      false;

    if (this.isForceChange && user) {
      this.forceChangeForm.patchValue({
        email: user.email,
      });
    }
  }

  get f() {
    return this.changePasswordForm.controls;
  }
  get ff() {
    return this.forceChangeForm.controls;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  onChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched(this.changePasswordForm);
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const { confirmPassword, ...passwordData } = this.changePasswordForm.value;

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Password changed successfully!';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.error = response.message || 'Password change failed';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error =
          error.error?.message || 'An error occurred while changing password';
        this.loading = false;
      },
    });
  }

  onForceChangePassword(): void {
    if (this.forceChangeForm.invalid) {
      this.markFormGroupTouched(this.forceChangeForm);
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const { confirmPassword, ...passwordData } = this.forceChangeForm.value;

    this.authService.forceChangePassword(passwordData).subscribe({
      next: (response) => {
        if (response.success) {
          this.success =
            'Password changed successfully! You are now logged in.';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.error = response.message || 'Password change failed';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error =
          error.error?.message || 'An error occurred while changing password';
        this.loading = false;
      },
    });
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  toggleMode(): void {
    this.isForceChange = !this.isForceChange;
    this.error = '';
    this.success = '';
  }
}
