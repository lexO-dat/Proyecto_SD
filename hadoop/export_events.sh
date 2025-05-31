#!/bin/bash

# Set proper permissions for all scripts
chmod +x /pig/data/export_events.sh
chmod +x /pig/data/run_analysis.sh
chmod +x /pig/data/display_results.sh

echo "Preparando la data..."

rm -f /pig/data/cleaned_events.csv
cp /pig/data/new.csv /pig/data/new_backup.csv
sed -i 's/Zalert-/\nalert-/g' /pig/data/new.csv

# Elimiinado del encabezado
sed -i '1d' /pig/data/new.csv

# Eliminado de lineas vacias
sed -i '/^$/d' /pig/data/new.csv

# permisos para el archivo
chmod 644 /pig/data/new.csv

echo "Pre-procesamiento completado"
echo "Total lines processed: $(wc -l < /pig/data/new.csv)"

echo "Consolidating filtered data..."
if [ -d "/pig/data/clean_new" ]; then
    cat /pig/data/clean_new/part-* > /pig/data/cleaned_events.csv
    
    echo "Filtered data consolidated to: /pig/data/cleaned_events.csv"
    echo "Total deduplicated records: $(wc -l < /pig/data/cleaned_events.csv)"
else
    echo "Warning: Filtered data directory not found!"
    echo "Available directories:"
    ls -la /pig/data/
fi