#!/bin/bash

# Script per restore del database MongoDB

# Configurazione
DB_NAME="taw-airline-system"
BACKUP_DIR="./backups"

# Controlla argomenti
if [ $# -eq 0 ]; then
    echo "📋 Utilizzo: ./restore-db.sh <nome_backup>"
    echo ""
    echo "🗂️  Backup disponibili:"
    ls -1 $BACKUP_DIR/ 2>/dev/null | grep backup_ || echo "   Nessun backup trovato"
    exit 1
fi

BACKUP_NAME=$1
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Verifica esistenza backup
if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ Errore: Backup '$BACKUP_NAME' non trovato"
    echo "🗂️  Backup disponibili:"
    ls -1 $BACKUP_DIR/ 2>/dev/null | grep backup_ || echo "   Nessun backup trovato"
    exit 1
fi

echo "🔄 Avvio restore database MongoDB..."
echo "📁 Backup: $BACKUP_PATH"

# Chiedi conferma
read -p "⚠️  Questo sovrascriverà il database esistente. Continuare? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Restore annullato"
    exit 0
fi

if docker ps | grep -q "mongodb"; then
    # Restore da container Docker
    echo "📦 Restore in container Docker..."
    
    # Copia backup nel container
    docker cp $BACKUP_PATH mongodb:/data/restore/
    
    # Rimuovi database esistente e ripristina
    docker exec mongodb mongorestore --db $DB_NAME --drop /data/restore/$BACKUP_NAME/$DB_NAME
    
    echo "✅ Restore completato dal backup: $BACKUP_NAME"
    
elif pgrep -x "mongod" > /dev/null; then
    # Restore da MongoDB locale
    echo "💻 Restore in MongoDB locale..."
    mongorestore --db $DB_NAME --drop $BACKUP_PATH/$DB_NAME
    
    echo "✅ Restore completato dal backup: $BACKUP_NAME"
    
else
    echo "❌ Errore: MongoDB non è in esecuzione"
    echo "💡 Suggerimenti:"
    echo "   - Per Docker: docker-compose up -d mongodb"
    echo "   - Per locale: sudo systemctl start mongod"
    exit 1
fi

echo "🎉 Database ripristinato con successo!"