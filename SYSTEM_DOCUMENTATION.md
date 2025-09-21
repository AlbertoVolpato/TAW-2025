# TAW 2025 - Sistema di Gestione Prenotazioni Voli
## Documentazione Tecnica Completa

---

## 1. ARCHITETTURA DEL SISTEMA

### 1.1 Panoramica Architetturale
Il sistema è basato su un'architettura **client-server** moderna con separazione netta tra frontend e backend:

- **Frontend**: Single Page Application (SPA) Angular 18+ con TypeScript
- **Backend**: API RESTful Node.js con Express.js 
- **Database**: MongoDB con Mongoose ODM
- **Containerizzazione**: Docker & Docker Compose
- **Autenticazione**: JWT (JSON Web Tokens) con refresh token

### 1.2 Componenti del Sistema

```
TAW-2025/
├── frontend/           # Angular SPA
│   ├── src/app/
│   │   ├── components/     # Componenti condivisi
│   │   ├── guards/         # Route guards
│   │   ├── interceptors/   # HTTP interceptors
│   │   ├── models/         # Modelli TypeScript
│   │   ├── modules/        # Moduli lazy-loaded
│   │   │   ├── admin/      # Modulo amministrazione
│   │   │   ├── airline/    # Modulo compagnie aeree
│   │   │   ├── flights/    # Modulo ricerca voli
│   │   │   └── passenger/  # Modulo passeggeri
│   │   └── services/       # Servizi Angular
│   └── environments/       # Configurazioni ambiente
├── backend/            # Node.js API
│   ├── src/
│   │   ├── controllers/    # Logic layer
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── scripts/            # Database seeding
└── docker-compose.yml  # Container orchestration
```

### 1.3 Flusso Architetturale

```
[Angular Frontend] ←→ [Express.js Backend] ←→ [MongoDB Database]
       ↕                      ↕
[Auth Guard]           [JWT Middleware]
       ↕                      ↕
[HTTP Interceptor]     [Route Protection]
```

---

## 2. MODELLO DATI (MongoDB)

### 2.1 Schema Database

Il sistema utilizza **MongoDB** con le seguenti collezioni principali:

#### 2.1.1 Collezione `users`
```javascript
{
  _id: ObjectId,
  username: String,        // Unique username
  email: String,          // Unique email
  password: String,       // Hashed password (bcrypt)
  role: String,          // 'admin' | 'airline' | 'passenger'
  firstName: String,
  lastName: String,
  isActive: Boolean,     // Account status
  createdAt: Date,
  updatedAt: Date,
  
  // Passenger-specific fields
  dateOfBirth: Date,
  phoneNumber: String,
  
  // Airline-specific fields
  airlineId: ObjectId    // Reference to airlines collection
}
```

#### 2.1.2 Collezione `airlines`
```javascript
{
  _id: ObjectId,
  name: String,           // Airline name
  code: String,          // IATA/ICAO code (unique)
  country: String,
  isActive: Boolean,
  isVerified: Boolean,   // Admin verification
  contactEmail: String,
  website: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2.1.3 Collezione `airports`
```javascript
{
  _id: ObjectId,
  name: String,          // Full airport name
  code: String,          // IATA code (unique, 3 chars)
  city: String,
  country: String,
  timezone: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isActive: Boolean,
  createdAt: Date
}
```

#### 2.1.4 Collezione `aircraft`
```javascript
{
  _id: ObjectId,
  model: String,         // Aircraft model
  manufacturer: String,  // Boeing, Airbus, etc.
  capacity: Number,      // Total seats
  range: Number,         // Max flight range in km
  isActive: Boolean,
  createdAt: Date
}
```

#### 2.1.5 Collezione `routes`
```javascript
{
  _id: ObjectId,
  airlineId: ObjectId,           // Reference to airlines
  departureAirportId: ObjectId,  // Reference to airports
  arrivalAirportId: ObjectId,    // Reference to airports
  distance: Number,              // Distance in km
  estimatedDuration: Number,     // Duration in minutes
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2.1.6 Collezione `flights`
```javascript
{
  _id: ObjectId,
  flightNumber: String,          // Unique flight identifier
  airlineId: ObjectId,           // Reference to airlines
  routeId: ObjectId,             // Reference to routes
  aircraftId: ObjectId,          // Reference to aircraft
  departureAirportId: ObjectId,  // Reference to airports
  arrivalAirportId: ObjectId,    // Reference to airports
  
  departureTime: Date,           // Scheduled departure
  arrivalTime: Date,             // Scheduled arrival
  actualDepartureTime: Date,     // Actual departure (optional)
  actualArrivalTime: Date,       // Actual arrival (optional)
  
  status: String,                // 'scheduled' | 'active' | 'completed' | 'cancelled'
  basePrice: Number,             // Base ticket price
  availableSeats: Number,        // Current available seats
  totalSeats: Number,            // Total aircraft capacity
  
  createdAt: Date,
  updatedAt: Date
}
```

#### 2.1.7 Collezione `bookings`
```javascript
{
  _id: ObjectId,
  bookingReference: String,      // Unique booking code
  userId: ObjectId,              // Reference to users (passenger)
  flightId: ObjectId,            // Reference to flights
  
  passengerDetails: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    documentNumber: String,
    email: String,
    phoneNumber: String
  },
  
  seatNumber: String,            // Assigned seat
  ticketPrice: Number,           // Final price paid
  status: String,                // 'pending' | 'confirmed' | 'cancelled'
  paymentStatus: String,         // 'pending' | 'completed' | 'failed'
  paymentId: String,             // External payment reference
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Relazioni tra Collezioni

```
users (passenger) ←--→ bookings ←--→ flights
                                        ↕
users (airline) ←--→ airlines ←--→ routes ←--→ airports
                        ↕              ↕
                    flights ←--→ aircraft
```

---

## 3. API REST ENDPOINTS

### 3.1 Autenticazione Endpoints

#### POST /api/auth/register
**Descrizione**: Registrazione nuovo utente
**Parametri**:
```json
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "passenger|airline"
}
```
**Risposta**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "userId",
    "username": "username",
    "email": "email",
    "role": "passenger"
  }
}
```

#### POST /api/auth/login
**Descrizione**: Autenticazione utente
**Parametri**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Risposta**:
```json
{
  "success": true,
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "userId",
    "username": "username",
    "role": "passenger"
  }
}
```

#### POST /api/auth/refresh
**Descrizione**: Refresh token JWT
**Headers**: `Authorization: Bearer <refreshToken>`
**Risposta**:
```json
{
  "success": true,
  "token": "new_jwt_access_token"
}
```

### 3.2 Voli Endpoints

#### GET /api/flights/search
**Descrizione**: Ricerca voli disponibili
**Query Parameters**:
- `departure`: Codice aeroporto partenza (es. MXP)
- `arrival`: Codice aeroporto arrivo (es. FCO)
- `departureDate`: Data partenza (YYYY-MM-DD)
- `passengers`: Numero passeggeri (default: 1)

**Risposta**:
```json
{
  "success": true,
  "flights": [
    {
      "id": "flightId",
      "flightNumber": "AZ123",
      "airline": {
        "name": "Alitalia",
        "code": "AZ"
      },
      "departureAirport": {
        "code": "MXP",
        "name": "Milano Malpensa",
        "city": "Milano"
      },
      "arrivalAirport": {
        "code": "FCO", 
        "name": "Roma Fiumicino",
        "city": "Roma"
      },
      "departureTime": "2025-09-22T14:30:00Z",
      "arrivalTime": "2025-09-22T16:15:00Z",
      "duration": 105,
      "availableSeats": 45,
      "basePrice": 89.99,
      "aircraft": {
        "model": "Airbus A320",
        "capacity": 180
      }
    }
  ],
  "total": 1
}
```

#### GET /api/flights/:id
**Descrizione**: Dettagli specifico volo
**Risposta**: Stesso formato del flight object sopra

### 3.3 Prenotazioni Endpoints

#### POST /api/bookings
**Descrizione**: Crea nuova prenotazione
**Headers**: `Authorization: Bearer <token>`
**Parametri**:
```json
{
  "flightId": "string",
  "passengerDetails": {
    "firstName": "string",
    "lastName": "string", 
    "dateOfBirth": "1990-01-01",
    "documentNumber": "string",
    "email": "string",
    "phoneNumber": "string"
  },
  "seatNumber": "12A"
}
```
**Risposta**:
```json
{
  "success": true,
  "booking": {
    "id": "bookingId",
    "bookingReference": "ABC123",
    "status": "pending",
    "ticketPrice": 89.99,
    "flight": { /* flight details */ }
  }
}
```

#### GET /api/bookings/user/:userId
**Descrizione**: Lista prenotazioni utente
**Headers**: `Authorization: Bearer <token>`
**Risposta**:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "bookingId",
      "bookingReference": "ABC123", 
      "status": "confirmed",
      "flight": { /* flight details */ },
      "createdAt": "2025-09-22T10:00:00Z"
    }
  ]
}
```

### 3.4 Compagnie Aeree Endpoints

#### GET /api/airlines
**Descrizione**: Lista tutte le compagnie aeree
**Risposta**:
```json
{
  "success": true,
  "airlines": [
    {
      "id": "airlineId",
      "name": "Alitalia",
      "code": "AZ", 
      "country": "Italy",
      "isActive": true,
      "isVerified": true
    }
  ]
}
```

#### POST /api/airlines/:airlineId/flights
**Descrizione**: Crea nuovo volo (solo compagnie aeree)
**Headers**: `Authorization: Bearer <token>`
**Parametri**:
```json
{
  "flightNumber": "AZ123",
  "routeId": "routeId",
  "aircraftId": "aircraftId",
  "departureTime": "2025-09-22T14:30:00Z",
  "arrivalTime": "2025-09-22T16:15:00Z",
  "basePrice": 89.99
}
```

### 3.5 Amministrazione Endpoints

#### GET /api/admin/users
**Descrizione**: Lista tutti gli utenti (solo admin)
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `page`: Numero pagina (default: 1)
- `limit`: Elementi per pagina (default: 10)
- `role`: Filtra per ruolo

#### PUT /api/admin/airlines/:id/verify
**Descrizione**: Verifica compagnia aerea (solo admin)
**Headers**: `Authorization: Bearer <token>`

---

## 4. GESTIONE AUTENTICAZIONE

### 4.1 Workflow di Autenticazione

```
1. User Registration/Login
   ↓
2. Backend validates credentials
   ↓
3. JWT Access Token generated (15min TTL)
   ↓  
4. JWT Refresh Token generated (7 days TTL)
   ↓
5. Tokens sent to frontend
   ↓
6. Frontend stores tokens (localStorage)
   ↓
7. HTTP Interceptor adds token to requests
   ↓
8. Backend middleware validates token
   ↓
9. Auto-refresh when access token expires
```

### 4.2 Implementazione JWT

#### Backend (Node.js)
```javascript
// JWT Token generation
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      role: user.role,
      username: user.username 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Middleware di autenticazione
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};
```

#### Frontend (Angular)
```typescript
// Auth Interceptor
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = this.authService.getToken();
              req = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next.handle(req);
            }),
            catchError(() => {
              this.authService.logout();
              return throwError(error);
            })
          );
        }
        return throwError(error);
      })
    );
  }
}
```

### 4.3 Autorizzazione Basata sui Ruoli

#### Route Guards (Frontend)
```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();
    
    if (!requiredRoles || requiredRoles.includes(userRole)) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

#### Middleware Autorizzazione (Backend)
```javascript
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    next();
  };
};

// Utilizzo nelle routes
router.get('/admin/users', authenticateToken, authorize(['admin']), getUsersController);
```

---

## 5. FRONTEND ANGULAR

### 5.1 Struttura Componenti

#### 5.1.1 Moduli Principali

**AppModule** (Root)
- AppComponent
- HeaderComponent  
- FooterComponent
- LoginComponent
- RegisterComponent

**AdminModule** (Lazy-loaded)
- AdminDashboardComponent
- UserManagementComponent
- AirlineManagementComponent
- SystemStatsComponent

**AirlineModule** (Lazy-loaded)  
- AirlineDashboardComponent
- FlightManagementComponent
- RouteManagementComponent
- BookingManagementComponent

**PassengerModule** (Lazy-loaded)
- FlightSearchComponent
- BookingListComponent
- ProfileComponent

**FlightsModule** (Lazy-loaded)
- FlightSearchComponent
- FlightDetailsComponent
- FlightResultsComponent

### 5.1.2 Servizi Angular

#### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            localStorage.setItem('accessToken', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); 
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? !this.isTokenExpired(token) : false;
  }
}
```

#### FlightService
```typescript
@Injectable({ providedIn: 'root' })
export class FlightService {
  constructor(private http: HttpClient) {}

  searchFlights(searchParams: FlightSearchParams): Observable<FlightSearchResponse> {
    return this.http.get<FlightSearchResponse>('/api/flights/search', {
      params: { ...searchParams }
    });
  }

  getFlightDetails(flightId: string): Observable<Flight> {
    return this.http.get<Flight>(`/api/flights/${flightId}`);
  }

  createFlight(flightData: CreateFlightRequest): Observable<Flight> {
    return this.http.post<Flight>('/api/flights', flightData);
  }
}
```

#### BookingService
```typescript
@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  createBooking(bookingData: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>('/api/bookings', bookingData);
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`/api/bookings/user/${userId}`);
  }

  cancelBooking(bookingId: string): Observable<void> {
    return this.http.delete<void>(`/api/bookings/${bookingId}`);
  }
}
```

### 5.1.3 Routing Configuration

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/flights/search', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  
  {
    path: 'airline', 
    loadChildren: () => import('./modules/airline/airline.module').then(m => m.AirlineModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['airline'] }
  },
  
  {
    path: 'passenger',
    loadChildren: () => import('./modules/passenger/passenger.module').then(m => m.PassengerModule),
    canActivate: [AuthGuard, RoleGuard], 
    data: { roles: ['passenger'] }
  },
  
  {
    path: 'flights',
    loadChildren: () => import('./modules/flights/flights.module').then(m => m.FlightsModule)
  },
  
  { path: '**', redirectTo: '/flights/search' }
];
```

### 5.1.4 Modelli TypeScript

```typescript
// user.model.ts
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

// flight.model.ts  
export interface Flight {
  id: string;
  flightNumber: string;
  airline: {
    id: string;
    name: string;
    code: string;
  };
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  availableSeats: number;
  totalSeats: number;
  basePrice: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  aircraft: {
    model: string;
    capacity: number;
  };
}

// booking.model.ts
export interface Booking {
  id: string;
  bookingReference: string;
  flight: Flight;
  passengerDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    documentNumber: string;
    email: string;
    phoneNumber: string;
  };
  seatNumber: string;
  ticketPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
```

---

## 6. ESEMPI WORKFLOW APPLICAZIONE

### 6.1 Workflow Passeggero

#### 6.1.1 Ricerca e Prenotazione Volo

```
1. Accesso Homepage
   ↓ (Componente: FlightSearchComponent)
2. Inserimento criteri ricerca
   - Aeroporto partenza/arrivo
   - Data viaggio  
   - Numero passeggeri
   ↓ (Service: FlightService.searchFlights())
3. Visualizzazione risultati
   ↓ (Componente: FlightResultsComponent) 
4. Selezione volo specifico
   ↓ (Route: /flights/:id)
5. Visualizzazione dettagli volo
   ↓ (Componente: FlightDetailsComponent)
6. Click "Prenota" → Login richiesto se non autenticato
   ↓ (Guard: AuthGuard)
7. Inserimento dati passeggero
   ↓ (Componente: BookingFormComponent)
8. Conferma prenotazione
   ↓ (Service: BookingService.createBooking())
9. Pagamento (mock)
   ↓ (Service: PaymentService)
10. Conferma finale e invio email
```

**Screenshot Workflow**:
- Homepage con form ricerca
- Lista risultati voli con filtri
- Dettaglio volo con mappa rotta
- Form prenotazione con validazione
- Pagina conferma prenotazione

#### 6.1.2 Gestione Prenotazioni Esistenti

```
1. Login passeggero
   ↓ (Route: /passenger/bookings)
2. Visualizzazione lista prenotazioni
   ↓ (Componente: BookingListComponent)
3. Filtri per stato/data
4. Dettaglio prenotazione singola
5. Opzioni: Cancellazione/Modifica (se permesso)
```

### 6.2 Workflow Compagnia Aerea

#### 6.2.1 Gestione Voli

```
1. Login compagnia aerea
   ↓ (Route: /airline/dashboard)
2. Dashboard con statistiche
   - Voli totali/attivi/oggi
   - Prenotazioni recenti
   ↓ (Componente: AirlineDashboardComponent)
3. Gestione voli
   ↓ (Route: /airline/flights)
4. Lista voli esistenti con azioni:
   - Crea nuovo volo
   - Modifica volo esistente
   - Cancella volo
   ↓ (Componente: FlightManagementComponent)
5. Form creazione/modifica volo
   - Selezione rotta
   - Selezione aeromobile
   - Orari e prezzi
```

**Screenshot Workflow**:
- Dashboard compagnia con metriche
- Lista voli con paginazione e filtri
- Form creazione volo con dropdown
- Gestione rotte con mappa

#### 6.2.2 Gestione Rotte

```
1. Accesso gestione rotte
   ↓ (Route: /airline/routes)
2. Visualizzazione rotte esistenti
   ↓ (Componente: RouteManagementComponent)
3. Operazioni su rotte:
   - Crea nuova rotta
   - Attiva/disattiva rotta
   - Modifica dettagli rotta
4. Form creazione rotta:
   - Selezione aeroporti partenza/arrivo
   - Calcolo automatico distanza
   - Stima durata volo
```

### 6.3 Workflow Amministratore

#### 6.3.1 Gestione Sistema

```
1. Login amministratore
   ↓ (Route: /admin/dashboard)
2. Dashboard sistema con:
   - Statistiche globali
   - Attività recenti
   - Alert sistema
   ↓ (Componente: AdminDashboardComponent)
3. Gestione utenti
   ↓ (Route: /admin/users)
4. Lista utenti con:
   - Filtri per ruolo/stato
   - Azioni: attiva/disattiva/elimina
   ↓ (Componente: UserManagementComponent)
5. Gestione compagnie aeree
   ↓ (Route: /admin/airlines)
6. Verifica/approvazione compagnie
```

**Screenshot Workflow**:
- Dashboard admin con grafici
- Tabella utenti con controlli
- Form verifica compagnia aerea
- Pannello statistiche sistema

### 6.4 Workflow Tecnico

#### 6.4.1 Processo di Autenticazione

```
Frontend                    Backend                     Database
   |                          |                           |
   |-- POST /auth/login -->   |                           |
   |                          |-- Query user by email -> |
   |                          |                           |-- Return user
   |                          |<-- User data ------------ |
   |                          |                           |
   |                          |-- Verify password        |
   |                          |-- Generate JWT tokens    |
   |                          |                           |
   |<-- Tokens + user data ---|                           |
   |                          |                           |
   |-- Store in localStorage  |                           |
   |-- Navigate to dashboard  |                           |
```

#### 6.4.2 Gestione Errori e Retry

```typescript
// HTTP Error Handling
return this.http.get('/api/flights/search').pipe(
  retry(3),
  catchError((error: HttpErrorResponse) => {
    if (error.status === 0) {
      // Network error
      return throwError('Errore di connessione');
    } else if (error.status >= 500) {
      // Server error  
      return throwError('Errore interno del server');
    } else {
      // Client error
      return throwError(error.error.message || 'Errore imprevisto');
    }
  })
);
```

---

## 7. TECNOLOGIE E DIPENDENZE

### 7.1 Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1"
  }
}
```

### 7.2 Frontend Dependencies

```json
{
  "dependencies": {
    "@angular/core": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/router": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/http": "^18.0.0",
    "rxjs": "^7.8.1",
    "tailwindcss": "^3.3.6",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "typescript": "~5.4.0",
    "karma": "~6.4.0",
    "jasmine": "~5.1.0"
  }
}
```

### 7.3 Containerizzazione

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/taw2025?authSource=admin
      JWT_SECRET: your-secret-key

  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    depends_on:
      - backend
    environment:
      API_URL: http://localhost:3000/api

volumes:
  mongodb_data:
```

---

## 8. SICUREZZA E PERFORMANCE

### 8.1 Misure di Sicurezza

1. **Password Hashing**: bcrypt con salt rounds 12
2. **JWT Tokens**: Access token (15min) + Refresh token (7 giorni)  
3. **CORS Configuration**: Restrizione domini autorizzati
4. **Rate Limiting**: 100 requests/15min per IP
5. **Input Validation**: Joi schemas per tutti gli endpoints
6. **Headers Security**: Helmet.js per headers sicuri
7. **SQL Injection**: Mongoose ODM previene injection
8. **XSS Protection**: Angular sanitization + CSP headers

### 8.2 Ottimizzazioni Performance

1. **Database Indexing**: 
   ```javascript
   // Indexes per query comuni
   db.flights.createIndex({ "departureAirportId": 1, "arrivalAirportId": 1, "departureTime": 1 });
   db.bookings.createIndex({ "userId": 1, "createdAt": -1 });
   db.users.createIndex({ "email": 1 }, { unique: true });
   ```

2. **Frontend Lazy Loading**: Moduli caricati on-demand
3. **HTTP Caching**: Cache headers per dati statici
4. **Connection Pooling**: MongoDB connection pool
5. **Pagination**: Tutti gli endpoints con paginazione
6. **Image Optimization**: Immagini compresse e responsive

---

## 9. TESTING E DEPLOYMENT

### 9.1 Strategia Testing

#### Backend Testing
```javascript
// Jest unit tests
describe('AuthController', () => {
  test('should login user with valid credentials', async () => {
    const mockUser = { email: 'test@test.com', password: 'password123' };
    const response = await request(app)
      .post('/api/auth/login')
      .send(mockUser)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
```

#### Frontend Testing
```typescript
// Jasmine/Karma unit tests
describe('FlightService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FlightService]
    });
  });

  it('should search flights', () => {
    const service = TestBed.inject(FlightService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.searchFlights(mockSearchParams).subscribe(result => {
      expect(result.flights.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/flights/search');
    expect(req.request.method).toBe('GET');
  });
});
```

### 9.2 Deployment

#### Production Build
```bash
# Frontend build
cd frontend
npm run build:prod

# Backend build  
cd backend
npm run build

# Docker deployment
docker-compose -f docker-compose.prod.yml up -d
```

#### Environment Variables
```bash
# Backend .env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@host:27017/database
JWT_SECRET=strong-secret-key
JWT_REFRESH_SECRET=another-strong-secret
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@airline.com
EMAIL_PASS=app-password
```

---

## 10. CONCLUSIONI

Il sistema **TAW 2025** implementa una soluzione completa per la gestione delle prenotazioni voli con architettura moderna, sicurezza robusta e interfaccia utente intuitiva. 

**Punti di forza**:
- Architettura scalabile e modulare
- Autenticazione sicura con JWT
- Interface responsive e accessibile  
- API REST ben documentate
- Gestione errori comprehensive
- Containerizzazione per deployment facile

**Tecnologie chiave utilizzate**:
- **Frontend**: Angular 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Express.js, MongoDB
- **Autenticazione**: JWT con refresh tokens
- **Containerizzazione**: Docker & Docker Compose

Il progetto rispetta tutti i requisiti funzionali richiesti e implementa best practices per sicurezza, performance e manutenibilità del codice.