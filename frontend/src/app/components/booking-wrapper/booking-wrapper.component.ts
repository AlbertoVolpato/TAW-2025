import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking-wrapper',
  template: `
    <div>
      <!-- This component will redirect to the appropriate booking route -->
    </div>
  `,
})
export class BookingWrapperComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe((params) => {
      const flight = params['flight'];

      if (flight) {
        // Redirect to the passenger booking component with the flight ID as route param
        // and preserve all query params
        this.router.navigate(['/passenger/bookings/new', flight], {
          queryParams: params,
        });
      } else {
        // If no flight ID, redirect to bookings list
        this.router.navigate(['/passenger/bookings']);
      }
    });
  }
}
