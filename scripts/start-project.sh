#!/bin/bash

# Script per avvio completo del progetto TAW-2025

echo "🚀 Avvio TAW-2025 - Sistema Gestione Compagnie Aeree"
echo ""

# Controlla se Docker è installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non trovato. Installare Docker prima di continuare."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non trovato. Installare Docker Compose prima di continuare."
    exit 1
fi

echo "🐳 Avvio servizi con Docker..."
echo "   - MongoDB: Database"
echo "   - Backend: API Node.js (npm install + build + start)"
echo "   - Frontend: App Angular (npm install + build + start)"
echo ""

# Ferma container esistenti
docker-compose down

# Avvia tutti i servizi
docker-compose up -d

echo ""
echo "⏳ Attendo avvio servizi..."
sleep 20

echo ""
echo "📊 Inizializzo dati di test..."
docker-compose exec backend npm run initialize-data

echo ""
echo "✅ Progetto avviato!"
echo ""
echo "🌐 Accesso applicazione:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo "   MongoDB:  mongodb://localhost:27017"
echo ""
echo "👥 Utenti di test:"
echo "   Admin:      admin@taw.com / admin123"
echo "   Passeggero: passenger@test.com / passenger123"
echo "   Compagnia:  airline@test.com / airline123"
echo ""
echo "🛠️ Comandi utili:"
echo "   docker-compose logs -f        # Visualizza logs"
echo "   docker-compose down           # Ferma servizi"
echo "   ./scripts/backup-db.sh        # Backup database"