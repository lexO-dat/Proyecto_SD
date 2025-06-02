#!/bin/bash

# Set proper permissions for all scripts
chmod +x /pig/data/export_events.sh
chmod +x /pig/data/run_analysis.sh
chmod +x /pig/data/display_results.sh

echo "extrayendo data desde elasticsearch"

echo "Preparando la data..."

rm -f /pig/data/cleaned_events.csv
cp /pig/data/new.csv /pig/data/new_backup.csv

# Si el archivo tiene header (primera línea contiene "ID,TYPE"), se elimina
if head -n 1 /pig/data/new.csv | grep -q "^ID,TYPE"; then
    echo "Removiendo header del CSV..."
    sed -i '1d' /pig/data/new.csv
fi

sed -i 's/Zalert-/\nalert-/g' /pig/data/new.csv

# eliminamos lineas vacias
sed -i '/^$/d' /pig/data/new.csv

# eliminamos lineas que contengan undefined
sed -i '/undefined/d' /pig/data/new.csv

# permisos para el archivo
chmod 644 /pig/data/new.csv


if [ -d "/pig/data/clean_new" ]; then
    cat /pig/data/clean_new/part-* > /pig/data/cleaned_events.csv
    
    echo "Filtered data consolidated to: /pig/data/cleaned_events.csv"
    echo "Total deduplicated records: $(wc -l < /pig/data/cleaned_events.csv)"
else
    echo "Warning: Filtered data directory not found!"
    echo "Available directories:"
    ls -la /pig/data/
fi