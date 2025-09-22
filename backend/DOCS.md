# Backend API - Documentazione

Sistema backend per gestione compagnie aeree costruito con Node.js, Express e TypeScript.

## 🏗️ Architettura

### Stack Tecnologico
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Linguaggio**: TypeScript 5.x
- **Database**: MongoDB 6+ con Mongoose ODM
- **Autenticazione**: JWT + bcrypt

### Struttura Progetto
```
src/
├── app.ts              # Configurazione Express
├── bin/www.ts          # Entry point server
├── config/
│   └── database.ts     # Configurazione MongoDB
├── controllers/        # Logica business per API
├── middleware/         # Auth, validazione, logging
├── models/            # Schemi database Mongoose
├── routes/            # Definizione endpoint API
├── services/          # Logica business complessa
└── utils/             # Utilità e helper
```

## 📊 Modelli Database

### User
- **Ruoli**: admin, passenger, airline
- **Campi**: email, password (hash), nome, cognome, ruolo, attivo
- **Autenticazione**: JWT tokens, sessioni

### Airline
- **Gestione**: Nome, IATA code, paese, logo
- **Relazioni**: Collegate a utenti airline e flotte aircraft

### Aircraft
- **Dettagli**: Modello, capacità, tipo, stato operativo
- **Gestione**: Assegnati a compagnie specifiche

### Flight
- **Programmazione**: Origine, destinazione, orari, prezzi
- **Classi**: Economy, Business, First Class con prezzi differenziati
- **Stato**: Scheduled, Active, Cancelled, Completed

### Booking
- **Prenotazioni**: Passeggero, volo, posti, stato pagamento
- **Pagamenti**: credit_card, debit_card, paypal, bank_transfer, wallet

## 🔌 API Endpoints Principali

### Autenticazione (`/api/auth`)
- `POST /login` - Login utente
- `POST /register` - Registrazione passeggero
- `POST /logout` - Logout
- `GET /profile` - Profilo utente corrente

### Amministrazione (`/api/admin`)
- `GET /dashboard-stats` - Statistiche dashboard
- `GET /users` - Gestione utenti
- `POST /invite-airline` - Invita compagnia aerea
- `GET /system/activities` - Log attività sistema

### Compagnie Aeree (`/api/airlines`)
- `GET /` - Lista compagnie
- `POST /` - Crea compagnia (admin)
- `PUT /:id` - Aggiorna compagnia
- `DELETE /:id` - Elimina compagnia

### Voli (`/api/flights`)
- `GET /search` - Ricerca voli
- `GET /cheapest` - Voli più economici
- `POST /` - Crea volo (airline)
- `PUT /:id` - Aggiorna volo
- `GET /suggest-dates` - Suggerimenti date alternative

### Prenotazioni (`/api/bookings`)
- `GET /` - Lista prenotazioni utente
- `POST /` - Nuova prenotazione
- `GET /:id` - Dettaglio prenotazione
- `PUT /:id/cancel` - Cancella prenotazione

## 🔐 Sistema Autenticazione

### JWT Implementation
- **Token**: Scadenza 24h, refresh automatico
- **Middleware**: Protezione route private
- **Ruoli**: Controllo accesso basato su ruolo utente

### Password Security
- **Hashing**: bcrypt con salt rounds 10
- **Validazione**: Lunghezza minima, complessità

## 🛡️ Middleware

### Auth Middleware
- Verifica token JWT
- Estrazione utente corrente
- Controllo autorizzazioni ruolo

### Database Check
- Verifica connessione MongoDB
- Health check automatico

### Error Handling
- Gestione errori centralizzata
- Logging strutturato
- Response standardizzate

## ⚙️ Servizi

### Flight Availability Service
- Calcolo disponibilità posti
- Gestione classi di servizio
- Algoritmi pricing dinamico

### Data Initialization
- Seeding database iniziale
- Creazione utenti test
- Dati demo compagnie e voli

## 🚀 Deployment

### Sviluppo
```bash
npm install
npm run dev     # Hot reload con ts-node
```

### Produzione
```bash
npm run build   # Compilazione TypeScript
npm start       # Avvio server production
```

### Docker
```bash
docker build -t taw-backend .
docker run -p 3000:3000 taw-backend
```

## 📝 Variabili Ambiente

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taw-airline-system
JWT_SECRET=your-secret-key
```

## 🔧 Scripts NPM

- `npm run dev` - Sviluppo con hot reload
- `npm run build` - Build produzione
- `npm start` - Avvio produzione
- `npm run initialize-data` - Inizializzazione dati test
- `npm test` - Test suite (se configurata)

## 📈 Monitoraggio

### Health Checks
- Endpoint `/api/health` per status sistema
- Verifica connessione database
- Metriche performance base

### Logging
- Console logging strutturato
- Error tracking per debug
- Request/Response logging in development

Il backend fornisce un'API REST completa per la gestione di un sistema di prenotazione voli multi-tenant con supporto per amministratori, passeggeri e compagnie aeree.