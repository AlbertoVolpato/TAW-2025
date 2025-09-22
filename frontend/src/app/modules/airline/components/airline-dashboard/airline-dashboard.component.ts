import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss'],
})
export class AirlineDashboardComponent implements OnInit {
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateToFlights() {
    this.router.navigate(['/airline/flights']);
  }

  navigateToRoutes() {
    this.router.navigate(['/airline/routes']);
  }
}
