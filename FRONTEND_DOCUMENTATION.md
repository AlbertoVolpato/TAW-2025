# TAW 2025 - Documentazione Frontend Angular

---

## 1. ARCHITETTURA FRONTEND

### 1.1 Stack Tecnologico
- **Framework**: Angular 18+
- **Linguaggio**: TypeScript 5.4
- **Styling**: TailwindCSS
- **Build Tool**: Angular CLI
- **State Management**: Services con BehaviorSubject
- **HTTP**: HttpClient con interceptors

### 1.2 Struttura Modulare
```
src/app/
├── components/          # Componenti condivisi
│   ├── auth/           # Login/Register
│   ├── home/           # Homepage
│   └── profile/        # Profilo utente
├── guards/             # Route guards (auth, role)
├── interceptors/       # HTTP interceptors
├── models/             # Interfacce TypeScript
├── modules/            # Moduli lazy-loaded
│   ├── admin/          # Modulo amministrazione
│   ├── airline/        # Modulo compagnie aeree  
│   ├── flights/        # Modulo ricerca voli
│   └── passenger/      # Modulo passeggeri
├── services/           # Servizi Angular
└── shared/             # Componenti/utilities condivise
```

---

## 2. MODULI PRINCIPALI

### 2.1 AdminModule (Lazy-loaded)
**Rotte**: `/admin/*`
**Componenti**:
- `AdminDashboardComponent` - Dashboard con statistiche sistema
- `UserManagementComponent` - Gestione utenti e ruoli
- `AirlineManagementComponent` - Verifica compagnie aeree
- `SystemStatsComponent` - Metriche e reportistica

### 2.2 AirlineModule (Lazy-loaded) 
**Rotte**: `/airline/*`
**Componenti**:
- `AirlineDashboardComponent` - Dashboard compagnia con voli
- `FlightManagementComponent` - CRUD voli
- `RouteManagementComponent` - Gestione rotte
- `BookingManagementComponent` - Prenotazioni ricevute

### 2.3 PassengerModule (Lazy-loaded)
**Rotte**: `/passenger/*`
**Componenti**:
- `BookingListComponent` - Storico prenotazioni utente
- `ProfileComponent` - Gestione dati personali
- `FlightBookingComponent` - Processo prenotazione

### 2.4 FlightsModule (Lazy-loaded)
**Rotte**: `/flights/*`
**Componenti**:
- `FlightSearchComponent` - Form ricerca voli
- `FlightResultsComponent` - Lista risultati
- `FlightDetailsComponent` - Dettaglio volo singolo

---

## 3. SERVIZI CORE

### 3.1 AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Metodi: login(), logout(), register(), refreshToken()
  // JWT token management e localStorage
}
```

### 3.2 FlightService
```typescript 
@Injectable({ providedIn: 'root' })
export class FlightService {
  // Metodi: searchFlights(), getFlightDetails(), createFlight()
  // Gestione ricerca e CRUD voli
}
```

### 3.3 BookingService
```typescript
@Injectable({ providedIn: 'root' })
export class BookingService {
  // Metodi: createBooking(), getUserBookings(), cancelBooking()
  // Gestione prenotazioni passeggeri
}
```

---

## 4. SICUREZZA E ROUTING

### 4.1 Guards
- **AuthGuard**: Verifica autenticazione JWT
- **RoleGuard**: Autorizzazione basata su ruoli (admin/airline/passenger)

### 4.2 HTTP Interceptor
- Aggiunge automaticamente token JWT alle richieste
- Gestisce refresh token automatico su 401
- Redirect al login su errori di autenticazione

### 4.3 Routing Configuration
```typescript
const routes: Routes = [
  { path: 'admin', loadChildren: () => AdminModule, canActivate: [AuthGuard, RoleGuard] },
  { path: 'airline', loadChildren: () => AirlineModule, canActivate: [AuthGuard, RoleGuard] },
  { path: 'passenger', loadChildren: () => PassengerModule, canActivate: [AuthGuard, RoleGuard] },
  { path: 'flights', loadChildren: () => FlightsModule }
];
```

---

## 5. MODELLI TYPESCRIPT

### 5.1 User Model
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'airline' | 'passenger';
  firstName: string;
  lastName: string;
  isActive: boolean;
  airlineId?: string;
}
```

### 5.2 Flight Model
```typescript
export interface Flight {
  id: string;
  flightNumber: string;
  airline: { id: string; name: string; code: string; };
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  basePrice: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}
```

### 5.3 Booking Model
```typescript
export interface Booking {
  id: string;
  bookingReference: string;
  flight: Flight;
  passengerDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
  };
  ticketPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}
```

---

## 6. UI/UX FEATURES

### 6.1 Design System
- **Framework**: TailwindCSS per styling utility-first
- **Responsività**: Mobile-first design
- **Tema**: Palette colori coerente con brand aeroportuale
- **Accessibilità**: ARIA labels e navigazione keyboard

### 6.2 Componenti Condivisi
- **LoadingSpinner**: Indicatori di caricamento
- **ErrorMessage**: Gestione errori user-friendly
- **Pagination**: Componente riutilizzabile per liste
- **ConfirmDialog**: Modali di conferma azioni
- **DatePicker**: Selezione date per ricerca voli

### 6.3 Stati Applicazione
- **Loading States**: Skeleton loaders durante fetch
- **Empty States**: Messaggi quando non ci sono dati
- **Error States**: Gestione errori con retry button
- **Success States**: Feedback positivo per azioni completate

---

## 7. PERFORMANCE E OTTIMIZZAZIONI

### 7.1 Lazy Loading
- Tutti i moduli principali caricati on-demand
- Riduzione bundle size iniziale
- Code splitting automatico

### 7.2 Change Detection
- OnPush strategy per componenti performance-critical
- Async pipe per osservabili
- TrackBy functions per ngFor

### 7.3 Caching
- HTTP response caching per dati statici
- Service worker per offline capability
- LocalStorage per user preferences

---

## 8. BUILD E DEPLOYMENT

### 8.1 Development
```bash
ng serve --host 0.0.0.0 --port 4200
```

### 8.2 Production Build
```bash
ng build --configuration=production
# Output: dist/ directory
# Bundle size optimization automatica
```

### 8.3 Docker Configuration
```dockerfile
FROM node:18-alpine
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

---

## 9. TESTING

### 9.1 Unit Testing
- **Framework**: Jasmine + Karma
- **Coverage**: >80% per servizi core
- **Mocking**: HttpClientTestingModule per API calls

### 9.2 E2E Testing  
- **Framework**: Cypress
- **Scenarios**: User flows principali
- **CI/CD**: Automated testing pipeline

---

## 10. WORKFLOW UTENTE

### 10.1 Passenger Journey
```
Homepage → Ricerca Voli → Selezione → Login → Prenotazione → Pagamento → Conferma
```

### 10.2 Airline Management
```
Login → Dashboard → Gestione Voli/Rotte → Monitoraggio Prenotazioni
```

### 10.3 Admin Operations  
```
Login → Dashboard → Gestione Utenti → Verifica Compagnie → System Stats
```

---

Il frontend Angular implementa un'architettura moderna e scalabile con focus su user experience, sicurezza e performance. L'uso di lazy loading, guards e interceptors garantisce un'applicazione robusta e maintainable.