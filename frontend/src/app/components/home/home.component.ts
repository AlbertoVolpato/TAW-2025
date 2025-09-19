import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface PopularDestination {
  name: string;
  country: string;
  price: string;
  image: string;
  code: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  quickSearchForm: FormGroup;

  popularDestinations: PopularDestination[] = [
    {
      name: 'Parigi',
      country: 'Francia',
      price: '€89',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop',
      code: 'CDG'
    },
    {
      name: 'Londra',
      country: 'Regno Unito',
      price: '€125',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
      code: 'LHR'
    },
    {
      name: 'New York',
      country: 'Stati Uniti',
      price: '€459',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
      code: 'JFK'
    },
    {
      name: 'Tokyo',
      country: 'Giappone',
      price: '€689',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
      code: 'NRT'
    },
    {
      name: 'Dubai',
      country: 'Emirati Arabi',
      price: '€349',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop',
      code: 'DXB'
    },
    {
      name: 'Los Angeles',
      country: 'Stati Uniti',
      price: '€529',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop',
      code: 'LAX'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.quickSearchForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      departureDate: ['', Validators.required],
      passengers: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Set default departure date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.quickSearchForm.patchValue({
      departureDate: tomorrow.toISOString().split('T')[0]
    });
  }

  navigateToSearch(): void {
    this.router.navigate(['/flights/search']);
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  swapCities(): void {
    const fromValue = this.quickSearchForm.get('from')?.value;
    const toValue = this.quickSearchForm.get('to')?.value;
    
    this.quickSearchForm.patchValue({
      from: toValue,
      to: fromValue
    });
  }

  onQuickSearch(): void {
    if (this.quickSearchForm.valid) {
      const formData = this.quickSearchForm.value;
      
      // Navigate to flight search with query parameters
      this.router.navigate(['/flights/search'], {
        queryParams: {
          from: formData.from,
          to: formData.to,
          departureDate: formData.departureDate,
          passengers: formData.passengers
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.quickSearchForm.controls).forEach(key => {
        this.quickSearchForm.get(key)?.markAsTouched();
      });
    }
  }

  searchDestination(destination: PopularDestination): void {
    this.router.navigate(['/flights/search'], {
      queryParams: {
        to: destination.code,
        departureDate: this.quickSearchForm.get('departureDate')?.value
      }
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}