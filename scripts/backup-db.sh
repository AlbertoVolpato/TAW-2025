#!/bin/bash

# Script per backup del database MongoDB

# Configurazione
DB_NAME="taw-airline-system"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

# Crea directory backup se non exists
mkdir -p $BACKUP_DIR

echo "🔄 Avvio backup database MongoDB..."

if docker ps | grep -q "mongodb"; then
    # Backup da container Docker
    echo "📦 Backup da container Docker..."
    docker exec mongodb mongodump --db $DB_NAME --out /data/backups/backup_$TIMESTAMP
    docker cp mongodb:/data/backups/backup_$TIMESTAMP $BACKUP_PATH
    
    echo "✅ Backup completato: $BACKUP_PATH"
    echo "📊 Dimensione backup:"
    du -sh $BACKUP_PATH
    
elif pgrep -x "mongod" > /dev/null; then
    # Backup da MongoDB locale
    echo "💻 Backup da MongoDB locale..."
    mongodump --db $DB_NAME --out $BACKUP_PATH
    
    echo "✅ Backup completato: $BACKUP_PATH"
    echo "📊 Dimensione backup:"
    du -sh $BACKUP_PATH
    
else
    echo "❌ Errore: MongoDB non è in esecuzione"
    echo "💡 Suggerimenti:"
    echo "   - Per Docker: docker-compose up -d mongodb"
    echo "   - Per locale: sudo systemctl start mongod"
    exit 1
fi

# Lista backup esistenti
echo ""
echo "📋 Backup disponibili:"
ls -la $BACKUP_DIR/