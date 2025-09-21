# Flight Booking System - TAW 2025

Un sistema completo di prenotazione voli sviluppato con Angular 18 (frontend) e Node.js/Express/MongoDB (backend).

## 🚀 Caratteristiche Principali

### Frontend (Angular 18)
- **Architettura Moderna**: Standalone components, Signals, e nuove API di Angular 18
- **Autenticazione Completa**: Login, registrazione, gestione profilo con JWT
- **Ricerca Voli Avanzata**: Filtri multipli, ordinamento, paginazione
- **Selezione Posti**: Interfaccia interattiva per la scelta dei posti a sedere
- **Gestione Prenotazioni**: Creazione, modifica, cancellazione prenotazioni
- **Dashboard Admin**: Gestione compagnie aeree, aeroporti, voli
- **Responsive Design**: Ottimizzato per desktop, tablet e mobile
- **Tema Scuro/Chiaro**: Supporto completo per entrambi i temi
- **Accessibilità**: Conforme alle linee guida WCAG 2.1
- **PWA Ready**: Configurato come Progressive Web App

### Backend (Node.js/Express)
- **API RESTful**: Endpoints completi per tutte le funzionalità
- **Autenticazione JWT**: Sistema sicuro di autenticazione e autorizzazione
- **Database MongoDB**: Schema ottimizzato con Mongoose
- **Middleware Avanzati**: Logging, CORS, validazione, error handling
- **Ruoli Utente**: Admin, Airline, User con permessi differenziati
- **Validazione Dati**: Validazione completa lato server
- **Seeding Database**: Script per popolare il database con dati di test

## 🛠️ Tecnologie Utilizzate

### Frontend
- **Angular 18** - Framework principale
- **TypeScript** - Linguaggio di programmazione
- **SCSS** - Preprocessore CSS
- **RxJS** - Programmazione reattiva
- **Angular Material** - Componenti UI
- **Chart.js** - Grafici e visualizzazioni

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Database NoSQL
- **Mongoose** - ODM per MongoDB
- **JWT** - Autenticazione
- **bcryptjs** - Hashing password
- **Joi** - Validazione dati

## 📋 Prerequisiti

- Node.js (v18 o superiore)
- npm (v9 o superiore)
- MongoDB (v6 o superiore)
- Angular CLI (v18 o superiore)

## 🚀 Installazione e Avvio

### 1. Clona il Repository
```bash
git clone https://github.com/your-username/TAW-2025.git
cd TAW-2025
```

### 2. Setup Backend
```bash
cd backend
npm install

# Crea file .env
cp .env.example .env
# Modifica .env con le tue configurazioni

# Avvia MongoDB (se locale)
mongod

# Popola il database con dati di test
npm run seed

# Avvia il server di sviluppo
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install

# Avvia il server di sviluppo
npm start
```

### 4. Accesso all'Applicazione
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

## 👥 Utenti di Test

Dopo aver eseguito il seeding, puoi utilizzare questi account:

### Admin
- **Email**: admin@flightbooking.com
- **Password**: admin123
- **Ruolo**: Amministratore sistema

### Compagnia Aerea
- **Email**: airline@alitalia.com
- **Password**: airline123
- **Ruolo**: Gestione compagnia aerea

### Utente Standard
- **Email**: user@example.com
- **Password**: user123
- **Ruolo**: Cliente

## 📁 Struttura del Progetto

```
TAW-2025/
├── frontend/                 # Applicazione Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Componenti riutilizzabili
│   │   │   ├── pages/        # Pagine dell'applicazione
│   │   │   ├── services/     # Servizi Angular
│   │   │   ├── guards/       # Route guards
│   │   │   ├── interceptors/ # HTTP interceptors
│   │   │   ├── models/       # Interfacce TypeScript
│   │   │   └── utils/        # Utility functions
│   │   ├── assets/           # Risorse statiche
│   │   └── styles/           # Stili globali
│   └── package.json
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── controllers/      # Controller delle API
│   │   ├── models/           # Modelli Mongoose
│   │   ├── routes/           # Definizione routes
│   │   ├── middleware/       # Middleware personalizzati
│   │   ├── config/           # Configurazioni
│   │   └── utils/            # Utility functions
│   └── package.json
└── README.md
```

## 🔧 Configurazione

### Variabili d'Ambiente Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/flightbooking

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Configurazione Frontend
Le configurazioni del frontend si trovano in:
- `src/environments/environment.ts` (sviluppo)
- `src/environments/environment.prod.ts` (produzione)

## 🧪 Testing

### Frontend
```bash
cd frontend

# Unit tests
npm run test

# E2E tests
npm run e2e

# Coverage
npm run test:coverage
```

### Backend
```bash
cd backend

# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 📦 Build e Deploy

### Frontend
```bash
cd frontend

# Build per produzione
npm run build

# Build con analisi bundle
npm run build:analyze
```

### Backend
```bash
cd backend

# Build TypeScript
npm run build

# Avvio produzione
npm start
```

## 🔒 Sicurezza

- **Autenticazione JWT**: Token sicuri con scadenza
- **Hashing Password**: bcryptjs con salt
- **Validazione Input**: Joi per validazione server-side
- **CORS**: Configurazione restrittiva
- **Rate Limiting**: Protezione contro attacchi DDoS
- **Helmet**: Headers di sicurezza HTTP

## 🌐 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout utente

### Voli
- `GET /api/flights` - Lista voli
- `GET /api/flights/search` - Ricerca voli
- `GET /api/flights/:id` - Dettaglio volo
- `POST /api/flights` - Crea volo (Admin/Airline)
- `PUT /api/flights/:id` - Aggiorna volo (Admin/Airline)
- `DELETE /api/flights/:id` - Elimina volo (Admin/Airline)

### Prenotazioni
- `GET /api/bookings` - Lista prenotazioni utente
- `POST /api/bookings` - Crea prenotazione
- `GET /api/bookings/:id` - Dettaglio prenotazione
- `PUT /api/bookings/:id` - Aggiorna prenotazione
- `DELETE /api/bookings/:id` - Cancella prenotazione

### Aeroporti
- `GET /api/airports` - Lista aeroporti
- `GET /api/airports/search` - Ricerca aeroporti
- `GET /api/airports/:id` - Dettaglio aeroporto

### Compagnie Aeree
- `GET /api/airlines` - Lista compagnie aeree
- `GET /api/airlines/:id` - Dettaglio compagnia

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👨‍💻 Autore

- GitHub: [@AlbertoVolpato](https://github.com/albertovolpato)
- Email: albertovolpato22@gmail.com

---

**Nota**: Questo progetto è stato sviluppato per il corso di Tecnologie e Applicazioni Web (TAW) 2025.