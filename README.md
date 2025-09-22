# TAW-2025 - Sistema di Gestione Compagnie Aeree

Sistema completo per la gestione di compagnie aeree con amministrazione centralizzata e interfacce dedicate.

## 🚀 Avvio Rapido con Docker

```bash
# Clona il repository
git clone <repository-url>
cd TAW-2025

# Avvia tutto automaticamente
./scripts/start-project.sh

# Oppure direttamente:
docker-compose up -d
```

Docker farà automaticamente:
- `npm install` per backend e frontend
- `npm run build` per compilare tutto
- `npm start` per avviare i servizi

L'applicazione sarà disponibile su:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017

## 🏗️ Architettura

- **Frontend**: Angular 17 con TypeScript e TailwindCSS
- **Backend**: Node.js con Express e TypeScript
- **Database**: MongoDB con Mongoose
- **Containerizzazione**: Docker e Docker Compose

## 👥 Utenti di Test

### Admin
- Email: `admin@taw.com`
- Password: `admin123`

### Passeggero
- Email: `passenger@test.com` 
- Password: `passenger123`

### Compagnia Aerea
- Email: `airline@test.com`
- Password: `airline123`

## 🛠️ Sviluppo Locale

### Prerequisiti
- Node.js 18+
- MongoDB 6+
- npm o yarn

### Backend
```bash
cd backend
npm install
npm run dev  # Sviluppo con hot reload
```

### Frontend
```bash
cd frontend
npm install
npm start    # Sviluppo su http://localhost:4200
```

## 📊 Backup Database

### Backup Automatico
```bash
./scripts/backup-db.sh
```

### Restore Database
```bash
./scripts/restore-db.sh backup_20241201_120000
```

### Backup Manuale
```bash
# Backup da container Docker
docker exec mongodb mongodump --db taw-airline-system --out /data/backups

# Backup da MongoDB locale
mongodump --db taw-airline-system --out ./backups
```

## 📁 Struttura Progetto

```
TAW-2025/
├── backend/          # API Node.js/Express
├── frontend/         # App Angular
├── docker-compose.yml
└── README.md
```

## 🔧 Script Disponibili

### Gestione Progetto
- `./scripts/start-project.sh`: Avvio interattivo completo
- `./scripts/backup-db.sh`: Backup automatico database
- `./scripts/restore-db.sh`: Restore database da backup

### Sviluppo
- `npm run initialize-data`: Inizializza dati di test
- `npm run dev`: Avvio sviluppo backend
- `npm start`: Avvio sviluppo frontend
- `npm run build`: Build produzione

### Docker
- `docker-compose up -d`: Avvia tutto (install + build + start)
- `docker-compose logs -f`: Visualizza logs in tempo reale
- `docker-compose down`: Ferma tutti i servizi