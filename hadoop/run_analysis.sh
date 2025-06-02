#!/bin/bash

# Set proper permissions for all scripts
chmod +x export_events.sh
chmod +x display_results.sh
chmod +x run_analysis.sh
chmod +x fetch_from_elastic.sh

# Cambiar al directorio raíz del proyecto
cd ..

# Ejecutar solo el servicio de analytics usando el compose principal
sudo docker compose --profile analytics up --build hadoop-analytics

echo ""
echo "Analisis completado, ejecuta ./hadoop/display_results.sh para ver los resultados."

# Volver al directorio hadoop
cd hadoop