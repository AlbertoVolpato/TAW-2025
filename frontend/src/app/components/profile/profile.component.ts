import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-redirect">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Reindirizzamento in corso...</p>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-redirect {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f5f5f5;
      }

      .loading-container {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #1976d2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      p {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Redirect based on user role
    if (this.authService.isAuthenticated()) {
      this.authService.redirectBasedOnRole();
    } else {
      this.authService.logout();
    }
  }
}
