#!/bin/bash

# Set proper permissions for all scripts
chmod +x export_events.sh
chmod +x display_results.sh
chmod +x run_analysis.sh

echo "=== Pig Data Analysis Script ==="
echo "Building and running Pig analysis..."

sudo docker compose down
sudo docker compose build
sudo docker compose up

echo ""

echo "Analisis completado, ejecuta ./display_results.sh para ver los resultados."
