# Frontend Angular - Documentazione

Applicazione web Angular per gestione compagnie aeree con interfacce multi-ruolo e design responsive.

## 🏗️ Architettura

### Stack Tecnologico
- **Framework**: Angular 17+
- **Linguaggio**: TypeScript 5.x
- **Styling**: SCSS + TailwindCSS 3.x
- **UI Components**: Angular Material (parziale)
- **Build Tool**: Angular CLI + Webpack
- **Responsive**: Mobile-first design

### Struttura Progetto
```
src/app/
├── components/         # Componenti condivisi (auth, home, profile)
├── guards/            # Route guards per autenticazione
├── interceptors/      # HTTP interceptors
├── models/           # TypeScript interfaces/types
├── modules/          # Feature modules lazy-loaded
│   ├── admin/        # Dashboard amministratore
│   ├── airline/      # Gestione compagnia aerea
│   ├── flights/      # Ricerca e booking voli
│   └── passenger/    # Area passeggero
├── services/         # Servizi HTTP e business logic
└── shared/           # Utilità e componenti riusabili
```

## 🎨 Design System

### Tema Principale
- **Colori**: Palette blu professionale con gradienti
- **Tipografia**: Inter font family, responsive scale
- **Layout**: Grid system con breakpoint standard
- **Componenti**: Card-based UI, hero sections

### SCSS Architecture
- **Variabili**: Colori, spaziature, breakpoint centralizzati
- **Mixins**: Gradienti, transizioni, responsive utilities
- **Moduli**: Organizzazione per componente/feature

## 🚦 Routing e Navigazione

### Route Structure
```
/ (home)
├── /auth/login        # Autenticazione
├── /auth/register     # Registrazione
├── /admin/*          # Area amministratore
├── /airline/*        # Dashboard compagnia
├── /passenger/*      # Area passeggero
└── /flights/*        # Ricerca voli
```

### Guards
- **AuthGuard**: Protezione route autenticate
- **RoleGuard**: Controllo accesso per ruolo
- **Redirect**: Automatico in base a ruolo utente

## 👥 Moduli per Ruolo

### Admin Module
- **Dashboard**: Statistiche sistema, grafici
- **User Management**: CRUD utenti, inviti compagnie
- **System Monitor**: Attività, logs, performance
- **Airline Oversight**: Supervisione compagnie

### Airline Module
- **Dashboard**: Statistiche compagnia, ricavi
- **Fleet Management**: Gestione aircraft
- **Route Management**: Creazione/modifica rotte
- **Flight Scheduling**: Programmazione voli
- **Pricing**: Gestione tariffe per classe

### Passenger Module
- **Flight Search**: Interfaccia ricerca avanzata
- **Booking Management**: Storico prenotazioni
- **Profile**: Gestione profilo personale
- **Payment**: Integrazione sistemi pagamento

### Flights Module (Pubblico)
- **Search Interface**: Form ricerca multi-parametro
- **Results Display**: Lista voli con filtri
- **Date Suggestions**: Alternative date/prezzi
- **Booking Flow**: Processo prenotazione guidato

## 🔌 Servizi HTTP

### Auth Service
- Login/logout con JWT
- Gestione token automatica
- User state management
- Role-based permissions

### API Services
- **AdminService**: Endpoint amministrazione
- **AirlineService**: API gestione compagnie
- **FlightService**: Ricerca e booking voli
- **UserService**: Gestione profili utente
- **BookingService**: Prenotazioni e pagamenti

### HTTP Interceptors
- **AuthInterceptor**: Inject JWT token automatico
- **ErrorInterceptor**: Gestione errori centralizzata
- **LoadingInterceptor**: Spinner automatici (se implementato)

## 📱 Responsive Design

### Breakpoint Strategy
- **Mobile**: < 768px - Stack verticale, menu hamburger
- **Tablet**: 768px - 1024px - Layout ibrido
- **Desktop**: > 1024px - Layout full, sidebar navigation

### TailwindCSS Integration
- Utility-first approach
- Custom theme configuration
- Responsive modifiers
- Component extraction patterns

## 🎯 Componenti Chiave

### Authentication Components
- **LoginComponent**: Form login con validazione
- **RegisterComponent**: Registrazione passeggero
- **ProfileComponent**: Gestione dati utente

### Dashboard Components
- **AdminDashboard**: Pannello controllo sistema
- **AirlineDashboard**: Statistiche compagnia
- **StatCards**: Metriche visuali
- **ActivityFeed**: Feed attività recenti

### Flight Components
- **FlightSearch**: Form ricerca avanzata
- **FlightResults**: Lista risultati con filtri
- **BookingForm**: Processo prenotazione
- **SeatSelection**: Selezione posti (se implementato)

### Management Components
- **UserManagement**: CRUD utenti
- **AirlineManagement**: Gestione compagnie
- **FleetManagement**: Gestione flotta
- **RouteManagement**: Creazione rotte

## 🔄 State Management

### Service-Based State
- Servizi singleton per state sharing
- BehaviorSubject per reactive updates
- Local storage per persistenza
- Session management per auth state

### Component Communication
- **@Input/@Output**: Parent-child communication
- **Services**: Cross-component data sharing
- **Route Params**: Navigation state
- **Query Params**: Filter/search state

## 🚀 Build e Deploy

### Development
```bash
npm install
ng serve           # Dev server su http://localhost:4200
ng build --watch   # Build con watch mode
```

### Production
```bash
ng build --prod    # Build ottimizzata
ng test           # Unit tests
ng e2e            # End-to-end tests
```

### Docker
```bash
docker build -t taw-frontend .
docker run -p 4200:4200 taw-frontend
```

## ⚙️ Configurazione

### Environment Files
- `environment.ts` - Sviluppo
- `environment.prod.ts` - Produzione
- API endpoints, feature flags

### Angular.json
- Build configurations
- Asset management
- Style preprocessing
- Bundle optimization

## 🛠️ Sviluppo

### Code Style
- Angular style guide
- ESLint + Prettier
- Consistent naming conventions
- Component/service separation

### Performance
- Lazy loading modules
- OnPush change detection strategy
- TrackBy functions per *ngFor
- Image optimization

L'applicazione fornisce un'esperienza utente completa per la gestione di prenotazioni aeree con interfacce specializzate per ogni tipo di utente e design responsive moderno.