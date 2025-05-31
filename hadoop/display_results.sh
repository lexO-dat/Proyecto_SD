#!/bin/bash

# Set proper permissions for this script
chmod +x display_results.sh

echo " Resultados de procesamiento de datos de eventos de tráfico"
echo

# Count total records
total_dedup=$(wc -l < cleaned_events.csv)
echo "DATASET OVERVIEW"
echo "├─ Original records processed: 18,390"
echo "├─ After deduplication: $total_dedup"
echo "└─ Data source: Santiago traffic events"
echo

# Event type analysis
echo "EVENT TYPE DISTRIBUTION"
echo "┌─────────────────────────────┬────────────┬─────────────┐"
echo "│ Event Type                  │ Count      │ Percentage  │"
echo "├─────────────────────────────┼────────────┼─────────────┤"
total_events=$(cat results/event_counts/part-r-00000 | cut -d',' -f2 | paste -sd+ | bc)
while IFS=',' read -r type count; do
    percentage=$(echo "scale=1; $count * 100 / $total_events" | bc)
    printf "│ %-27s │ %10s │ %10s%% │\n" "$type" "$count" "$percentage"
done < results/event_counts/part-r-00000
echo "├─────────────────────────────┼────────────┼─────────────┤"
printf "│ %-27s │ %10s │ %10s%% │\n" "TOTAL" "$total_events" "100.0"
echo "└─────────────────────────────┴────────────┴─────────────┘"
echo

echo "Top 15 comunnas con más eventos"
echo "┌─────────────────────────────┬────────────┐"
echo "│ Comuna                      │ Events     │"
echo "├─────────────────────────────┼────────────┤"
head -15 results/comuna_analysis/part-r-00000 | while IFS=',' read -r comuna count; do
    printf "│ %-27s │ %10s │\n" "$comuna" "$count"
done
echo "├─────────────────────────────┼────────────┤"
total_comunas=$(wc -l < results/comuna_analysis/part-r-00000)
printf "│ %-27s │ %10s │\n" "Total unique comunas" "$total_comunas"
echo "└─────────────────────────────┴────────────┘"
echo

echo "Top 15 sub tipos de eventos"
echo "┌─────────────────────────────┬────────────┐"
echo "│ Type-Subtype                │ Count      │"
echo "├─────────────────────────────┼────────────┤"
head -15 results/type_subtype_analysis/part-r-00000 | while IFS=',' read -r combination count; do
    printf "│ %-27s │ %10s │\n" "$combination" "$count"
done
echo "└─────────────────────────────┴────────────┘"
echo

echo "Distribución por horas"
if [ -s results/hourly_analysis/part-r-00000 ]; then
    echo "┌──────────┬────────────┬─────────────────────────────┐"
    echo "│ Hour     │ Count      │ Distribution                │"
    echo "├──────────┼────────────┼─────────────────────────────┤"
    max_count=$(cat results/hourly_analysis/part-r-00000 | cut -d',' -f2 | sort -n | tail -1)
    while IFS=',' read -r hour count; do
        bar_length=$(echo "scale=0; $count * 25 / $max_count" | bc)
        bar=$(printf "%*s" "$bar_length" | tr ' ' '█')
        printf "│ %8s │ %10s │ %-25s │\n" "${hour}:00" "$count" "$bar"
    done < results/hourly_analysis/part-r-00000
    echo "└──────────┴────────────┴─────────────────────────────┘"
else
    echo "No hourly data available (processing issue detected)"
    echo "   Timestamp format: $(head -1 cleaned_events.csv | cut -d',' -f12)"
    echo "   Sample timestamp analysis needed for debugging"
fi
echo

git add .
git commit -m "feat: Implementado análisis de datos de tráfico con Hadoop y Pig"
-m "# Features:
- ambiente de desarrollo con Docker Compose para Hadoop y Pig
- analisis de datos duplicados y filtrado de eventos basado en ID con Apache Pig

# Pipeline para procesado de datos:
- filter_data.pig: filtrado de los eventos por ID (18,390 → 5,862)
- process_events.pig: generado de las analisitcas y procesado de los eventos (por comuna, sub-tipo, hora -> con bug)
- export_events.sh: script para pre-procesar los datos y exportarlos a CSV (aqui irá el import desde ElasticSearch)

# Scripts:
- run_analysis.sh: script para ejecutar el compose y ejecutar el análisis
- display_results.sh: script para mostrar los resultados de la ejecucion

# Cosas por hacer:
- Integrar el compose y los docker de hadoop al compose general del proyecto
- Integrar elastic con hadoop (hacer que exporte en tiempo real el csv desde elastic para hacer el filtrado y procesado)"
